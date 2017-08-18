'use strict';

let net = require('net');

// This file contains the event handlers for the mpv module
// These function should not be called on their own, they are just bound
// to the respective events when the module is initialized
//
// Since they need access to some member variables they have to included to
// the module itself
//
// These events are bound in the _startStop.js submodule

let events = {
	// When the MPV is closed (either quit by the user or has crashed),
	// this handler is called
	//
	// If quit by the user, the quit event is emitted, does not occur
	// when the quit() method was used

	// If crashed the crashed event is emitted and if set to auto_restart, mpv
	// is restarted right away
	//
	// Event: close
	closeHandler: function (error_code) {
		// Clear all the listeners of this module
		this.mpvPlayer.removeAllListeners('close');
		this.mpvPlayer.removeAllListeners('error');
		this.mpvPlayer.removeAllListeners('message');
		clearInterval(this.timepositionListenerId);

		// destroy the socket because a new one will be created
		this.socket.socket.destroy();

		// unset the running flag
		this.running = false;

		// check the error code
		switch (error_code) {
			// quit by the user on purpose
			case 0:
				this.emit('quit');
				if(this.options.debug || this.options.verbose){
					console.log("MPV was quit by the user.");
				}
				break;
			// crashed
			case 4:
				// restart if auto restart enabled
				if(this.options.auto_restart){
					if(this.options.debug || this.options.verbose){
						console.log("MPV Player has crashed, tying to restart");
					}

					// restart mpv
					this.start()
					.then(() => {
						// emit crashed event
						this.emit('crashed');
						if(this.options.debug || this.options.verbose){
							console.log("Restarted MPV Player");
						}
					})
					// report the error if one occurs
					.catch((error) => {
						console.log(error);
					});
				}
				// disabled auto restart
				else{
					// emit crashed event
					this.emit('crashed');
					if(this.options.debug || this.options.verbose){
						console.log("MPV Player has crashed");
					}
				}
				break;
			default:
				if(this.options.debug || this.options.verbose){
					console.log("MPV player was terminated with an unknown error code: " + error_code);
				}
		}
	},
	// When ever an error is called from the MPV child process it is reported here
	//
	// @param error {Object}
	// Error object sent by MPV
	//
	// Event: error
	errorHandler: function (error) {
		if(this.options.debug){
			console.log(error);
		}
	},
	// Parses the messages emittet from the ipcInterface. They are all JSON objects
	// sent directly by MPV
	//
	// The different events
	// 		idle:			  MPV stopped playing
	// 		playback-restart: MPV started playing
	// 		pause:			  MPV has paused
	// 		resume: 		  MPV has resumed
	// 		property-change   One (or more) of the properties have changed
	// are handled. They are then turned into events of this module
	//
	// This handler also handles the properties requested via the getProperty methpd
	//
	// @param message {Object}
	// JSON message from MPV
	//
	// Event: message
	messageHandler: function (message) {
		// handle MPV event messages
		if("event" in message){
			// Handle the different event types
			switch(message.event) {
				case "idle":
					if(this.options.verbose){console.log("Event: stopped")};
					// emit stopped event
					this.emit("stopped");
					break;
				case "playback-restart":
					if(this.options.verbose){console.log("Event: start")};
					// emit play event
					this.emit("started");
					break;
				case "pause":
					if(this.options.verbose){console.log("Event: pause")};
					// emit paused event
					this.emit("paused");
					break;
				case "unpause":
					if(this.options.verbose){console.log("Event: unpause")};
					// emit unpaused event
					this.emit("resumed");
					break;
				case "seek":
					if(this.options.verbose){console.log("Event: seek")};
					// socket to watch for the change after a seek has happened
					let observeSocket = new net.Socket();
					// startseek position
					let seekstarttimepos = this.currentTimePos;
					// promise to watch the socket output
					new Promise((resolve, reject) => {
						// connect a tempoary socket to the mpv player
						observeSocket.connect({path: this.options.socket}, () =>{
							// receive the data
							observeSocket.on('data', (data) => {
								// console.log(data.toJSON());
								let messages = data.toString('utf-8').split('\n');
								// check every message
								messages.forEach((message) => {
									// ignore empty messages
									if(message.length > 0){
										message = JSON.parse(message);
										if("event" in message){
											// after the seek is finished the playback-restart event is emitted
											if(message.event === "playback-restart"){
												// resolve the promise
												resolve({
													"start": seekstarttimepos,
													"end": this.currentTimePos
												});
											}
											// when the track has changed we don't need a seek event
											else if (message.event === "tracks-changed"){
												reject("Track changed after seek");
											}
										}
									}
								});
							});
						});
					})
					// socket destruction and event emittion
					.then((times) => {
						observeSocket.destroy();
						this.emit('seek', (times));
					})
					// handle any rejection of the promise
					.catch((status) => {
						observeSocket.destroy();
						if(this.options.debug){
							console.log(status);
						}
					});
					break;
				// observed properties
				case "property-change":
					// time position events are handled seperately
					if(message.name === "time-pos"){
						// set the current time position
						this.currentTimePos = message.data;
					}
					else{
						// updates the observed value or adds it, if it was previously unobserved
						this.observed[message.name] = message.data;
						// emit a status change event
						this.emit('statuschange', this.observed);
						// output if verbose
						if(this.options.verbose){
							console.log("Event: statuschange");
							console.log("Property change: " + message.name + " - " + message.data);
						}
					}
					break;
				// Default
				default:
					break;

			}

		}
		// this API assumes that only get_property requests will have a request_id
		else if("request_id" in message){
			// output if verbose
			if(this.options.verbose){
				console.log("Get Request: " + message.request_id + " - " + message.data);
			}

			// IMPORTANT: This part is strongly coupled to the getProperty method
			// in _commands.js

			// Promise Way
			// gottenProperties[message.request_id] was already set to the resolve function
			if(this.gottenProperties[message.request_id]){
				// store the retrieved property inside the gottenProperties dictionary
				// this will resolve the promise in getProperty (_command.js)
				this.gottenProperties[message.request_id](message.data);
				// delete the entry from the gottenProperties dictionary
				delete this.gottenProperties[message.request_id];
			}

			// Non Promise Way
			// Deprecated
			else{
				// emit a getRequest event
				this.emit("getrequest", message.request_id, message.data);
			}

		}
	}

}

module.exports = events;
