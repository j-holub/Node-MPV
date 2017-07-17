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


let ipcInterface = function(options) {

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
	// Sends a command in the correct JSON format to mpv
	//
	// @param command {String}
	// @param args  {[String]}
	//
	command: function(command, args){
		// empty list if args was not set
		args = !args ? [] : args;
		// message in JSON Format
		var messageJson = {
			"command": [command, ...args]
		}
		var message = JSON.stringify(messageJson)
		this.send(message)
	},
	// Sets a certain property of mpv
	// Formats the message in the correct JSON format
	//
	// @param property {String}
	// @param value {property dependant}
	//
	setProperty: function(property, value){
		// message in JSON Format
		var messageJson = {
			"command": ["set_property", property, value]
		}
		var message = JSON.stringify(messageJson)
		this.send(message)
	},
	// Adds to a certain property of mpv, for example volume
	// Formats the message in the correct JSON format
	//
	// @param property {String}
	// @param value {number}
	//
	addProperty: function(property, value){
		// message in JSON Format
		var messageJson = {
			"command": ["add", property, value]
		}
		var message = JSON.stringify(messageJson);
		this.send(message)
	},
	// Multiplies a certain property of mpv
	// Formats the message in the correct JSON format
	//
	// @param property {String}
	// @param value {number}
	//
	multiplyProperty: function(property, value){
		var messageJson = {
			"command": ["multiply", property, value]
		}
		var message = JSON.stringify(messageJson);
		this.send(message)
	},
	// Gets the value of a certain property of mpv
	// Formats the message in the correct JSON format
	//
	// The answer comes over a JSON message which triggers an event
	// Also resolved using promises
	//
	// @param property {String}
	// @param value {number}
	//
	getProperty: function(property, request_id){
		// message in JSON Format
		var messageJson = {
			"command": ["get_property", property],
			request_id: request_id
		}
		var message = JSON.stringify(messageJson);
		this.send(message)
	},
	// Some mpv properties can be cycled, such as mute or fullscreen,
	// in which case this works like a toggle
	// Formats the message in the correct JSON format
	//
	// @param property {String}
	//
	cycleProperty: function(property){
		// message in JSON Format
		var messageJson = {
			"command": ["cycle", property]
		}
		var message = JSON.stringify(messageJson);
		this.send(message)
	},
	// Sends some arbitrary command to MPV
	//
	// @param command {String}
	//
	freeCommand: function(command){
		this.send(command);
	},
	// Closes the socket connection and removes all event listeners
	//
	quit: function(){
		// Remove all the event listeners
		this.socket.removeAllListeners('close');
		this.socket.removeAllListeners('error');
		this.socket.removeAllListeners('data');
		// Destroy the Net Socket
		this.socket.destroy();
	},
	// Sends message over the ipc socket and appends the \n character that
	// is required to end all messages to mpv
	// Prints an error message if MPV is not running
	//
	// Not supposed to be used from outside
	//
	// @param message {String}
	//
	send: function(message) {
		try{
			this.socket.write(message + '\n');
		}
		catch(error) {
			console.log(`ERROR: MPV is not running - tried so send the message '${message}' over socket '${this.options.socket}'`);
		}
	}
}, eventsModule,
   // inherit from EventEimmter
   eventEmitter.prototype);

module.exports = ipcInterface;
