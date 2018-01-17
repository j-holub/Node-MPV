'use strict';

const cuid    = require('cuid');

const commands = {
	// will send a get request for the specified property
	// if no idea is provided this will return a promise
	// if an id is provied the answer will come via a 'getrequest' event containing the id and data
	getProperty: function(property){
		return this.socket.getProperty(property);
	},
	// set a property specified by the mpv API
	setProperty: function(property, value){
		return this.socket.setProperty(property, value);
	},
	// sets all properties defined in the properties Json object
	setMultipleProperties: function(properties){
		Object.keys(properties).forEach(function (property) {
			this.socket.setProperty(property, properties[property]);
		}.bind(this));
	},
	// adds the value to the property
	addProperty: function(property, value){
		return this.socket.addProperty(property, value);
	},
	// multiplies the specified property by the value
	multiplyProperty: function(property, value) {
		return this.socket.multiplyProperty(property, value);
	},
	// cycles a arbitrary property
	cycleProperty: function(property){
		return this.socket.cycleProperty(property);
	},
	// send a command with arguments to mpv
	command: function(command, args){
		return this.socket.command(command, args);
	},
	// send a freely writeable command to mpv.
	// the required trailing \n will be added
	freeCommand: function(command){
		this.socket.freeCommand(command);
	},



	// observe a property for changes
	// will be added to event for property changes
	observeProperty: function(property, id) {
		this.observed[property] = null;
		this.observedIDs[id] = property;
		this.socket.command('observe_property', [id, property]);
	},
	// stop observing a property
	unobserveProperty: function(id) {
		delete this.observed[this.observedIDs[id]];
		delete this.observedIDs[id];
		this.socket.command('unobserve_property', [id]);
	}
}

module.exports = commands;
