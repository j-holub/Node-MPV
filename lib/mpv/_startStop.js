'use strict';

const spawn = require('child_process').spawn;
const exec = require('child_process').exec;


const ipcInterface = require('../ipcInterface/ipcInterface');
const util		   = require('../util');

const startStop = {
	// Starts the MPV player process
	//
	// After MPV is started the function listens to the spawned MPV child proecesses'
	// stdout for see whether it could create and bind the IPC socket or not.
	// If possible an ipcInterface is created to handle the socket communication
	//
	// Observes the properties defined in the observed object
	// Sets up the event handlers
	//
	// @return
	// Promise that is resolved when everything went fine or rejected when an
	// error occured
	//
	start: function() {
		// check if mpv is already running
		return new Promise((resolve, reject) => {
			this.running ? reject(this.errorHandler.errorMessage(6, 'start()')) : resolve();
		})
		// check if the binary is actually available
		.then(() => {return util.checkMpvBinary(this.options.binary)})
		// check for the corrrect ipc command
		.then(() => {return util.findIPCCommand(this.options)})
		// check if mpv could be started succesffuly
		.then((ipcCommand) => {
			return new Promise((resolve, reject) => {
				// add the ipcCommand to the arguments
				this.mpv_arguments.push(ipcCommand+'='+this.options.socket);
				// Spawns the mpv player
				this.mpvPlayer = spawn((this.options.binary ? this.options.binary : 'mpv'), this.mpv_arguments);

				// Listens to stdout to see, if MPV could bind the IPC socket
				this.mpvPlayer.stdout.on('data', (data) => {
					// stdout output
					const output = data.toString();

					// "Listening to IPC socket" - message
					if(output.match(/Listening/)){
						// remove the event listener on stdout
						this.mpvPlayer.stdout.removeAllListeners('data');
						resolve();
					}
					// "Could not bind IPC Socket" - message
					else if(output.match(/bind/)){
						// remove the event listener on stdout
						this.mpvPlayer.stdout.removeAllListeners('data');
						reject(this.errorHandler.errorMessage(4, 'startStop()', [this.options.socket]));
					}
				});
			});
		})
		// If the promise was resolved continue initializing the socket communication
		.then(() => {
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

			// Observe all the properties defined in the observed JSON object
			let id = 1; // 0 is for time-pos
			Object.keys(this.observed).forEach((property) => {
				// safety check
				if(property in this.observed){
					this.observeProperty(property, id);
					this.observedIDs[id] = property;
					id += 1;
				}
			});

			// ### Events ###

			// Close Event. Restarts MPV
			this.mpvPlayer.on('close', (error_code) => this.closeHandler(error_code));

			// Output any errors thrown by MPV
			this.mpvPlayer.on('error', (error) => this.errorHandler(error));

			// Handle the JSON messages received from MPV via the ipcInterface
			this.socket.on('message', (message) => this.messageHandler(message));


			// set the running flag
			this.running = true;

			// resolve this promise
			return;
		})

	},
	// Quits the MPV player
	//
	// All event handlers are unbound (thus preventing the close event from
	// restarting MPV
	// The socket is destroyed
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
		// unset the running flag
		this.running = false;
	},
	// Sows wheters mpv is running or not
	//
	// @return {boolean}
	isRunning: function() {
		return this.running;
	}
}

module.exports = startStop;
