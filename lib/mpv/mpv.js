'use strict';

// Child Process to module to start mpv player
const spawn = require('child_process').spawn;
const exec  = require('child_process').execSync;
const net   = require('net');
// EventEmitter
const eventEmitter = require('events').EventEmitter;

// the modules with all the member functions
const commandModule     = require('./_commands');
const controlModule     = require('./_controls');
const eventModule       = require('./_events');
const informationModule = require('./_information');
const playlistModule    = require('./_playlist');
const audioModule       = require('./_audio');
const videoModule       = require('./_video');
const subtitleModule    = require('./_subtitle');
const startStopModule   = require('./_startStop');


// Utility functions
const util = require('../util');
// Error Handler
const ErrorHandler = require('../error');


function mpv(options, mpv_args){

	// intialize the event emitter
	eventEmitter.call(this);

	// merge the user input options with the default options
	this.options = util.mergeDefaultOptions(options);


	// get the arguments to start mpv with
	this.mpv_arguments = util.mpvArguments(this.options, mpv_args);


	// observed properties
	// serves as a status object
	// can be enhanced by using the observeProperty function
	this.observed = util.observedProperties(this.options.audio_only);

	// saves the IDs of observedProperties with their propertyname
	// key:   id
	// value: property
	this.observedIDs = {};


	// timeposition of the current song
	this.currentTimePos = null;

	// states whether mpv is running or not
	this.running = false;

	// error handler
	this.errorHandler = new ErrorHandler();

}

mpv.prototype = Object.assign({
	constructor: mpv,

	// loads a file into mpv
	// mode
	// replace          replace current video
	// append          append to playlist
	// append-play  append to playlist and play, if the playlist was empty
	//
	// options
	// further options
	load: function(file, mode = 'replace', options) {
		return new Promise((resolve, reject) => {
			// check if this was called via load() or append() for error handling purposes
			const stackMatch  = new Error().stack.match(/mpv.\w+\s/g);
			const caller = stackMatch[stackMatch.length-1].split('.')[1].trim() + '()'

			// reject the promise if the mode is not correct
			if(!['replace', 'append', 'append-play'].includes(mode)){
				return reject(
					this.errorHandler.errorMessage(1, caller, options ? [file, mode].concat(options) : [file, mode], null, {
						'replace': 'Replace the currently playing title',
						'append': 'Append the title to the playlist',
						'append-play': 'Append the title and when it is the only title in the list start playback'
					})
				);
			}
			else{
				// socket to observe the command
				const observeSocket = net.Socket();
				observeSocket.connect({path: this.options.socket}, () =>{
					// send the command to mpv
					return this.socket.command('loadfile', options ? [file, mode].concat(util.formatOptions(options)) : [file, mode])
					.then(() => {
						// get the playlist size
						return this.getPlaylistSize();
					})
					.then((playlistSize) => {
						// if the mode is append resolve the promise because nothing
						// will be output by the mpv player
						// checking whether this file can be played or not is done when
						// the file is played
						if(mode === 'append'){
							observeSocket.destroy();
							return resolve();
						}
						// if the mode is append-play and there are already songs in the playlist
						// resolve the promise since nothing will be output
						if(mode === 'append-play' && playlistSize > 1){
							observeSocket.destroy();
							return resolve();
						}

						// timeout
						let timeout = 0;
						// check if the file was started
						let started = false;

						observeSocket.on('data', (data) => {
							// increase timeout
							timeout += 1;
							// parse the messages from the socket
							const messages = data.toString('utf-8').split('\n');
							// check every message
							messages.forEach((message) => {
								// ignore empty messages
								if(message.length > 0){
									message = JSON.parse(message);
									if('event' in message){
										if(message.event === 'start-file'){
											started = true;
										}
										// when the file has successfully been loaded resolve the promise
										else if(message.event === 'file-loaded' && started){
											observeSocket.destroy();
											// resolve the promise
											return resolve();
										}
										// when the track has changed we don't need a seek event
										else if (message.event === 'end-file' && started){
											observeSocket.destroy();
											return reject(this.errorHandler.errorMessage(0, caller, [file]));
										}
									}
								}
							});
							// reject the promise if it took to long until the playback-restart happens
							// to prevent having sockets listening forever
							if(timeout > 10){
								observeSocket.destroy();
								return reject(this.errorHandler.errorMessage(5, caller, [file]));
							}
						});

					});
				});

			}

		});
	},

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
