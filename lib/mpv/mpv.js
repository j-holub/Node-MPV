'use strict';

// Child Process to module to start mpv player
let spawn = require('child_process').spawn;
let exec  = require('child_process').execSync;
// EventEmitter
let eventEmitter = require('events').EventEmitter;

// the modules with all the member functions
let commandModule     = require('./_commands');
let controlModule     = require('./_controls');
let eventModule       = require('./_events');
let informationModule = require('./_information');
let playlistModule    = require('./_playlist');
let audioModule       = require('./_audio');
let videoModule       = require('./_video');
let subtitleModule    = require('./_subtitle');
let startStopModule   = require('./_startStop');


// Utility functions
let util = require('../util');


function mpv(options, mpv_args){

	// intialize the event emitter
	eventEmitter.call(this);


	// getProperty storage dictionary
	this.gottenProperties = {}


	// merge the user input options with the default options
	this.options = util.mergeDefaultOptions(options);


	// get the arguments to start mpv with
	this.mpv_arguments = util.mpvArguments(this.options, mpv_args);


	// observed properties
	// serves as a status object
	// can be enhanced by using the observeProperty function
	this.observed = util.observedProperties(this.options.audio_only);

	// saves the IDs of observedProperties with their propertyname
	// key: id  value: property
	this.observedIDs = {};


	// timeposition of the current song
	this.currentTimePos = null;

	// states whether mpv is running or not
	this.running = false;

}

mpv.prototype = Object.assign({
	constructor: mpv,

	// loads a file into mpv
	// mode
	// replace          replace current video
	// append          append to playlist
	// append-play  append to playlist and play, if the playlist was empty
	loadFile: function(file, mode) {
		mode = mode || "replace";
		this.socket.command("loadfile", [file, mode]);
	},
	// loads a stream into mpv
	// mode
	// replace          replace current video
	// append          append to playlist
	// append-play  append to playlist and play, if the playlist was empty
	loadStream: function(url, mode) {
		mode = mode || "replace";
		this.socket.command("loadfile", [url, mode]);
	}

// add all the other modules
}, audioModule,
   controlModule,
   commandModule,
   eventModule,
   informationModule,
   playlistModule,
   startStopModule,
   subtitleModule,
   videoModule,
   // inherit from EventEmitter
   eventEmitter.prototype);


// export the mpv class as the module
module.exports = mpv;
