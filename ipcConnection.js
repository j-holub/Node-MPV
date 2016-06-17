// Network Sockets
var net = require('net');

// for inheritence purposes
var util = require('util');

// EventEmitter
var eventEmitter = require('events').EventEmitter;

// connects to a socket
// reconnects when connection lost
// emits 'message' event when data is received from the socket
ipcConnection = function(socketFile) {

	// intialize the event emitter
	eventEmitter.call(this);

	// socket object
	this.socket = new net.Socket();

	// connect
	this.socket.connect({path: socketFile}, function() {
		console.log("Connected to socket " + socketFile);
	});

	// reestablish connection when lost
	this.socket.on('close', function() {
		console.log("mpv socket lost connection, reconnecting...");
		this.socket.connect({path: socketFile});
	}.bind(this));

	//  catch errors when occurrings
	this.socket.on('error', function(error) {
		console.log(error);
	});

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


ipcConnection.prototype = {
	constructor: ipcConnection,
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
	setProperty: function(property, value){
		// message in JSON Format
		var messageJson = {
			"command": ["set_property", property, value]
		}
		var message = JSON.stringify(messageJson)
		this.socket.write(message + "\n");
	}
}

// ipsConnection has to inherit from EventEmitter to emit the message
util.inherits(ipcConnection, eventEmitter);