// Network Sockets
var net = require('net');
// EventEmitter
var eventEmitter = require('events').EventEmitter;

// lodash for cleaner code
var _ = require('lodash');

// connects to a socket
// reconnects when connection lost
// emits 'message' event when data is received from the socket
ipcInterface = function(options) {

	this.options = {
		"debug": false,
		"verbose": false,
		"socket": "/tmp/node-mpv.sock"
	}

	this.options = _.defaults(options || {}, this.options);

	// intialize the event emitter
	eventEmitter.call(this);

	// socket object
	this.socket = new net.Socket();

	// connect
	this.socket.connect({path: this.options.socket}, function() {
		if(this.options.debug){
			console.log(`Connected to socket "${this.options.socket}`);
		}
	}.bind(this));


	// reestablish connection when lost
	this.socket.on('close', function() {
		if(this.options.debug){
			console.log("Lost connection to socket. Atemping to reconnect");
		}		
		// connect to socket
		this.socket.connect({path: this.options.socket}, function() {
			if(this.options.verbose || this.options.debug){
				console.log(`Connected to socket "${this.options.socket}`);
			}
		}.bind(this));
	}.bind(this));

	//  catch errors when occurrings
	this.socket.on('error', function(error) {
		if(this.options.debug){
			console.log(error);
		}
	}.bind(this));

	// received data is delivered upwards by an event
	this.socket.on('data', function(data) {
		// various messages might be fetched at once
		var messages = data.toString().split('\n');

		// each message is emitted seperately
		messages.forEach(function (message) {
			// empty messages may occur
			if(message.length > 0){
				this.emit('message', JSON.parse(message));
			}
		}.bind(this));

	}.bind(this));	

}


ipcInterface.prototype = _.extend({
	constructor: ipcInterface,
	// command: String
	// args: Array
	command: function(command, args){
		// message in JSON Format
		var messageJson = {
			"command": [command].concat(args)
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
	}

// inherit from EventEimmter via the lodash expand method
}, eventEmitter.prototype);

