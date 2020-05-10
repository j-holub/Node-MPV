'use strict';

// This module handles the communication with MPV over the IPC socket created by
// the MPV player
//
// It listens to the socket, parses the messages and forwards them to the mpv
// module
//
// It also offers methods for the communication with mpv

// Network Sockets
const net = require('net');
// EventEmitter
const eventEmitter = require('events').EventEmitter;


const eventsModule = require('./_events');

const ErrorHandler = require('../error');
const ipcRequest = require('./ipcRequest');
const util = require('../util');


const ipcInterface = function(options) {

	// save the options as member vars
	// Relevant for this module are
	//     debug:   debug option
	//     socket:  the socket path
	//     verbose: verbose option
	this.options = options;

	// dictionary to store the ipcRequest objects created for each request
	// it stores information about the request and wraps the promise reject
	// and resolve
	this.ipcRequests = {}

	// error handler
	this.errorHandler = new ErrorHandler();

	// intialize the event emitter
	eventEmitter.call(this);

	// unique ID that is increased for every message sent, this helps to match responses to sent requests
	// even if the integer overflows at some point, the IDs of messages sent close to each other are unqiue
	this.messageId = 0;

	// Node Net Socket
	this.socket = new net.Socket();
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
		// command list for the JSON command {'command': command_list}
		const command_list = [command, ...args];
		// send it over the socket
		return this.send(command_list)
	},
	// Sets a certain property of mpv
	// Formats the message in the correct JSON format
	//
	// @param property {String}
	// @param value {property dependant}
	//
	setProperty: function(property, value){
		// command list for the JSON command {'command': command_list}
		const command_list = ['set_property', property, value];
		// send it over the socket
		return this.send(command_list)
	},
	// Adds to a certain property of mpv, for example volume
	// Formats the message in the correct JSON format
	//
	// @param property {String}
	// @param value {number}
	//
	addProperty: function(property, value){
		// command list for the JSON command {'command': command_list}
		const command_list = ['add', property, value];
		// send it over the socket
		return this.send(command_list)
	},
	// Multiplies a certain property of mpv
	// Formats the message in the correct JSON format
	//
	// @param property {String}
	// @param value {number}
	//
	multiplyProperty: function(property, value){
		// command list for the JSON command {'command': command_list}
		const command_list = ['multiply', property, value];
		// send it over the socket
		return this.send(command_list)
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
	getProperty: function(property){
		// command list for the JSON command {'command': command_list}
		const command_list = ['get_property', property];
		// send it over the socket
		return this.send(command_list)
	},
	// Some mpv properties can be cycled, such as mute or fullscreen,
	// in which case this works like a toggle
	// Formats the message in the correct JSON format
	//
	// @param property {String}
	//
	cycleProperty: function(property){
		// command list for the JSON command {'command': command_list}
		const command_list = ['cycle', property];
		// send it over the socket
		return this.send(command_list)
	},
	// Sends some arbitrary command to MPV
	//
	// @param command {String}
	//
	freeCommand: function(command){
		try{
			this.socket.write(command + '\n');
		}
		catch(error) {
			console.log(`[Node-MPV]: ERROR: MPV is not running - tried so send the message '${message}' over socket '${this.options.socket}'`);
		}
	},
	// starts the socket connection
	// 
	// @param socket {String}
	// 
	connect: function(socket){
		// Connect to the socket specified in options
		this.socket.connect({path: socket}, () => {
			// Events
			// The event handler functions are defined in lib/ipcInterface/_events.js

			// Properly close the socket when it's closed from the other side
			this.socket.on('close', () => this.closeHandler());

			// Catch errors and output them if set to debug
			this.socket.on('error', (error) => this.errHandler(error));

			// Parse the data received from the socket and handle it to the mpv module
			this.socket.on('data',  (data) => this.dataHandler(data));

			// partially 'fixes' the EventEmitter leak
			// the leaking listeners is 'close', but I did not yet find any solution to fix it
			this.socket.setMaxListeners(0);

			if(this.options.debug){
				console.log(`[Node-MPV]: Connected to socket '${socket}'`);
			}
		});
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
	// @param command {String}
	//
	send: function(command) {
		return new Promise((resolve, reject) => {

			// reject the promise if the socket is not running, this is only the case if the mpv player is not running
			if (this.socket.destroyed){
				return reject(this.errorHandler.errorMessage(8, util.getCaller()));
			}

			// create the unique ID
			const request_id = this.messageId;			
			this.messageId++;
			// create the JSON message object
			const messageJson = {
				command: command,
				request_id: request_id
			}
			// create an ipcRequest object to store the required information for error messages
			// put the resolve function in the ipcRequests dictionary to call it later
			this.ipcRequests[request_id] = new ipcRequest(resolve, reject, Object.values(command).splice(1));
			try{
				this.socket.write(JSON.stringify(messageJson) + '\n');
			}
			// reject the promise in case of an error
			catch(error) {				
				return reject(this.errorHandler.errorMessage(7, message, 'send()', JSON.stringify(command)));
			}
		})

	}
}, eventsModule,
   // inherit from EventEimmter
   eventEmitter.prototype);

module.exports = ipcInterface;
