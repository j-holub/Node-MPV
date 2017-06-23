'use strict';

let spawn = require('child_process').spawn;

let ipcInterface = require('../ipcInterface/ipcInterface');

let startStop = {

	start: function() {
		// Start the mpv player with a promise to see when the IPC socket is ready
		return new Promise((resolve, reject) => {

			// Spawns the mpv player
			this.mpvPlayer = spawn((this.options.binary ? this.options.binary : 'mpv'), this.mpv_arguments);

			// Listens to stdout to see, if MPV could bind the IPC socket
			this.mpvPlayer.stdout.on('data', (data) => {
				// stdout output
				let output = data.toString();

				// "Listening to IPC socket" - message
				if(output.match(/Listening/)){
					resolve();
				}
				// "Could not bind IPC Socket" - message
				else if(output.match(/bind/)){
					reject(`Unable to bind '${this.options.socket} IPC socket`);
				}
			});
		})
		// If the promise was resolved continue initializing the socket communication
		.then(() => {
			return new Promise((resolve, reject) => {

				// Set up the socket connection
				this.socket = new ipcInterface(this.options);

				// sets the Interval to emit the current time position
				this.socket.command("observe_property", [0, "time-pos"]);
				this.timepositionListenerId = setInterval(() => {
					// only emit the time position if there is a file playing and it's not paused
					if(this.observed.filename && !this.observed.pause && this.currentTimePos != null){
						this.emit("timeposition", this.currentTimePos);
					}
				}, this.options.time_update * 1000);

				// private member method
				// will observe all properties defined in the observed JSON dictionary
				var observeProperties = function() {
					var id = 1;
					// for every property stored in observed
					Object.keys(this.observed).forEach(function (property) {
						// safety check
						if(this.observed.hasOwnProperty(property)){
							this.observeProperty(property, id);
							this.observedIDs[id] = property;
							id += 1;
						}
					}.bind(this));
				}.bind(this);
				// observe all properties defined by default
				observeProperties();

				// ### Events ###

				// if mpv crashes restart it again
				this.mpvPlayer.on('close', () => {
					if(this.options.debug){
						console.log("MPV Player seems to have died. Restarting...");
					}

					this.socket.socket.destroy();
					this.start()
						.then(() => {
							console.log("Restarted MPV Player");
							if(this.options.debug){
							}
						})
						.catch((error) => {
							console.log(error);
						});
				});

				// if spawn fails to start mpv player
				this.mpvPlayer.on('error', function(error) {
					if(this.options.debug){
						console.log(error);
					}
				}.bind(this));

				// handles the data received from the IPC socket
				this.socket.on('message', function(data) {
					// console.log("Message: " + JSON.stringify(data));
					// handle events
					if(data.hasOwnProperty("event")){

						// if verbose was specified output the event
						// property-changes are output in the statuschange emit
						if(this.options.verbose ){
							if(data.hasOwnProperty("event")){
								if(!(data.event === "property-change")){
									console.log("Message received: " + JSON.stringify(data));
								}
							}
							else{
								console.log("Message received: " + JSON.stringify(data));
							}
						}


						switch(data.event) {
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
							// observed properties
							case "property-change":
								// time position events are handled seperately
								if(data.name === "time-pos"){
									// set the current time position
									this.currentTimePos = data.data;
									break;
								}
								else{
									// updates the observed value or adds it, if it was previously unobserved
									this.observed[data.name] = data.data;
									// emit a status change event
									this.emit('statuschange', this.observed);
									// output if verbose
									if(this.options.verbose){
										console.log("Event: statuschange");
										console.log("Property change: " + data.name + " - " + data.data);
									}
									break;
								}
							default:

						}

					}
					// this API assumes that only get_property requests will have a request_id
					else if(data.hasOwnProperty("request_id")){

						// output if verbose
						if(this.options.verbose){
							console.log("Get Request: " + data.request_id + " - " + data.data);
						}

						// This part is strongly coupled to the getProperty method in _commands.js

						// Promise Way
						// gottenProperties[data.request_id] was already set to the resolve function
						if(this.gottenProperties[data.request_id]){
							// store the retrieved property inside the gottenProperties dictionary
							// this will resolve the promise in getProperty (_command.js)
							this.gottenProperties[data.request_id](data.data);
							// delete the entry from the gottenProperties dictionary
							delete this.gottenProperties[data.request_id];
						}
						// Non Promise Way
						else{
							// emit a getRequest event
							this.emit("getrequest", data.request_id, data.data);
						}

					}


				}.bind(this));

				// resolve the promise
				resolve();

			});

		})

	},
	// Stops mpv player
	quit: function() {
		// Clear all the listeners of this module
		this.mpvPlayer.removeAllListeners('close');
		this.mpvPlayer.removeAllListeners('error');
		this.mpvPlayer.removeAllListeners('message');
		clearInterval(this.timepositionListenerId);
		// send the quit message to MPV
		this.socket.command("quit");
		// Quit the socket
		this.socket.quit();
	}

}

module.exports = startStop;
