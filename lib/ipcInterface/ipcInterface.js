'use strict';

// This module handles the communication with MPV over the IPC socket created by
// the MPV player
//
// It listens to the socket, parses the messages and forwards them to the mpv
// module
//
// It also offers methods for the communication with mpv

// Network Sockets
let net = require('net');
// EventEmitter
let eventEmitter = require('events').EventEmitter;


// Event Handlers
let eventsModule = require('./_events');


var ipcInterface = function(options) {

	// save the options as member vars
	// Relevant for this module are
	//     debug:   debug option
	//     socket:  the socket path
	//     verbose: verbose option
	this.options = options;

	// intialize the event emitter
	eventEmitter.call(this);

	// Node Net Socket
	this.socket = new net.Socket();

	// partially "fixes" the EventEmitter leak
	// the leaking listeners is "close", but I did not yet find any solution to fix it
	this.socket.setMaxListeners(0);

	// Connect to the socket specified in options
	this.socket.connect({path: this.options.socket}, () => {
		if(this.options.debug){
			console.log(`Connected to socket '${this.options.socket}'`);
		}
	});


	// Events
	// The event handler functions are defined in lib/ipcInterface/_events.js

	// Properly close the socket when it's closed from the other side
	this.socket.on('close', () => this.closeHandler());

	// Catch errors and output them if set to debug
	this.socket.on('error', (error) => this.errorHandler(error));

	// Parse the data received from the socket and handle it to the mpv module
	this.socket.on('data',  (data) => this.dataHandler(data));

}


ipcInterface.prototype = Object.assign({
	constructor: ipcInterface,
	// command: String
	// args: Array
	command: function(command, args){
		// empty list if args was not set
		args = !args ? [] : args;
		// message in JSON Format
		var messageJson = {
			"command": [command, ...args]
		}
		var message = JSON.stringify(messageJson)
		this.socket.write(message + "\n");
	},
	// property: String
	// value: property dependant
	setProperty: function(property, value){
		// message in JSON Format
		var messageJson = {
			"command": ["set_property", property, value]
		}
		var message = JSON.stringify(messageJson)
		this.socket.write(message + "\n");
	},
	// property: String
	// value: number
	addProperty: function(property, value){
		// message in JSON Format
		var messageJson = {
			"command": ["add", property, value]
		}
		var message = JSON.stringify(messageJson);
		this.socket.write(message + "\n");
	},
	// propertty: String
	// value: number
	multiplyProperty: function(property, value){
		var messageJson = {
			"command": ["multiply", property, value]
		}
		var message = JSON.stringify(messageJson);
		this.socket.write(message + "\n");
	},
	// property: String
	// request-id: number
	getProperty: function(property, request_id){
		// message in JSON Format
		var messageJson = {
			"command": ["get_property", property],
			request_id: request_id
		}
		var message = JSON.stringify(messageJson);
		this.socket.write(message + "\n");
	},
	// property: String
	cycleProperty: function(property){
		// message in JSON Format
		var messageJson = {
			"command": ["cycle", property]
		}
		var message = JSON.stringify(messageJson);
		this.socket.write(message + "\n");
	},
	// command: String
	freeCommand: function(command){
		this.socket.write(command + "\n");
	},
	quit: function(){
		// Remove all the event listeners
		this.socket.removeAllListeners('close');
		this.socket.removeAllListeners('error');
		this.socket.removeAllListeners('data');
		// Destroy the Net Socket
		this.socket.destroy();
	}
}, eventsModule,
   // inherit from EventEimmter
   eventEmitter.prototype);

module.exports = ipcInterface;
