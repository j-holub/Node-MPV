'use strict';

// This file contains the event handlers for the ipcInterface module
// These function should not be called on their own, they are just bound
// to the respective events when the module is intiailized
//
// Since they need access to some member variables they have to included to
// the module itself

let events = {
	// Thrown when the socket is closed by the other side
	// This function properly closes the socket by destroying it
	// Usually this will occur when MPV has crashed. The restarting is handled
	// by the mpv module, which will again recreate a socket
	//
	// Event: close
	closeHandler: function() {
		if(this.options.debug){
			console.log("Socket closed on the other side. This usually occurrs \
						 when MPV has crashed");
		}
		// properly close the connection
		this.socket.destroy();
	},
	// Cathces any error thrown by the socket and outputs it to the console if
	// set to debug
	//
	// @param error {Object}
	// Errorobject from the socket
	//
	// Event: error
	errorHandler: function(error) {
		if(this.options.debug){
			console.log(error);
		}
	},
	// Handles the data received by MPV over the ipc socket
	// MPV messages end with the \n character, this function splits it and for
	// each message received, it is sent upward to the MPV module, using the
	// message event
	//
	// @param data {String}
	// Data from the socket
	//
	// Event: data
	dataHandler: function(data) {
		// various messages might be fetched at once
		let messages = data.toString().split('\n');

		// each message is emitted seperately
		messages.forEach((message) => {
			// empty messages may occur
			if(message.length > 0){
				this.emit('message', JSON.parse(message));
			}
		});
	}
}

module.exports = events;
