'use strict';

const cuid = require('cuid');

const util = require('../util');

const commands = {
	// will send a get request for the specified property
	// if no idea is provided this will return a promise
	// if an id is provied the answer will come via a 'getrequest' event containing the id and data
	getProperty: function(property){
		return new Promise((resolve, reject) => {
			this.running ? resolve(this.socket.getProperty(property)) : reject(
				this.errorHandler.errorMessage(8, util.getCaller())
			);
		});
	},
	// set a property specified by the mpv API
	setProperty: function(property, value){
		return new Promise((resolve, reject) => {
			this.running ? resolve(this.socket.setProperty(property, value)) : reject(
				this.errorHandler.errorMessage(8, util.getCaller())
			);
		});
	},
	// sets all properties defined in the properties Json object
	setMultipleProperties: function(properties){
		return new Promise((resolve, reject) => {
			// check if the player is running
			if(this.running){
				// list of all promises
				let promises = []
				// add all promises  to the list
				Object.keys(properties).forEach((property) => {
					promises.push(this.socket.setProperty(property, properties[property]));
				});
				// return the promise all object
				resolve(Promise.all(promises));
			}
			// reject if MPV is not running
			else{
				return reject(
					this.errorHandler.errorMessage(8, util.getCaller())
				);
			}
		})
	},
	// adds the value to the property
	addProperty: function(property, value){
		return new Promise((resolve, reject) => {
			this.running ? resolve(this.socket.addProperty(property, value)) : reject(
				this.errorHandler.errorMessage(8, util.getCaller())
			);
		});
	},
	// multiplies the specified property by the value
	multiplyProperty: function(property, value) {
		return new Promise((resolve, reject) => {
			this.running ? resolve(this.socket.multiplyProperty(property, value)) : reject(
				this.errorHandler.errorMessage(8, util.getCaller())
			);
		});
	},
	// cycles a arbitrary property
	cycleProperty: function(property){
		return new Promise((resolve, reject) => {
			this.running ? resolve(this.socket.cycleProperty(property)) : reject(
				this.errorHandler.errorMessage(8, util.getCaller())
			);
		});
	},
	// send a command with arguments to mpv
	command: function(command, args){
		return new Promise((resolve, reject) => {
			this.running ? resolve(this.socket.command(command, args)) : reject(
				this.errorHandler.errorMessage(8, util.getCaller())
			);
		});
	},
	// send a freely writeable command to mpv.
	// the required trailing \n will be added
	freeCommand: function(command){
		this.socket.freeCommand(command);
	},



	// observe a property for changes
	// will be added to event for property changes
	observeProperty: function(property, id) {
		return new Promise((resolve, reject) => {
			if(this.running){
				this.observed[property] = null;
				this.observedIDs[id] = property;
				resolve(this.socket.command('observe_property', [id, property]));
			}
			else{
				reject(
					this.errorHandler.errorMessage(8, util.getCaller())
				);
			}
		});
	},
	// stop observing a property
	unobserveProperty: function(id) {
		return new Promise((resolve, reject) => {
			if(this.running){
				delete this.observed[this.observedIDs[id]];
				delete this.observedIDs[id];
				resolve(this.socket.command('unobserve_property', [id]));
			}
			else{
				reject(
					this.errorHandler.errorMessage(8, util.getCaller())
				);
			}
		});
	},
}

module.exports = commands;
