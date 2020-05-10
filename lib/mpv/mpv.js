'use strict';

// Child Process to module to start mpv player
const spawn = require('child_process').spawn;
const exec  = require('child_process').execSync;
const net   = require('net');
const path  = require('path');
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


const ErrorHandler = require('../error');
const ipcInterface = require('../ipcInterface/ipcInterface');
const util = require('../util');


function mpv(options, mpv_args){

	// intialize the event emitter
	eventEmitter.call(this);

	// merge the user input options with the default options
	this.options = util.mergeDefaultOptions(options);


	// get the arguments to start mpv with
	this.mpv_arguments = util.mpvArguments(this.options, mpv_args);

	// saves the IDs of observedProperties with their propertyname
	// key:   property
	// value: id
	this.observedProperties = {};


	// timeposition of the current song
	this.currentTimePos = null;

	// states whether mpv is running or not
	this.running = false;

	// error handler
	this.errorHandler = new ErrorHandler();

	// set up the ipcInterface
	this.socket = new ipcInterface(this.options);
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
	load: async function(source, mode = 'replace', options) {
		// check if this was called via load() or append() for error handling purposes
		const caller = util.getCaller();

		// reject if mpv is not running
		if (!this.running){
			throw (
				this.errorHandler.errorMessage(8, caller, options ? [source, mode].concat(options) : [source, mode], null, {
					'replace': 'Replace the currently playing title',
					'append': 'Append the title to the playlist',
					'append-play': 'Append the title and when it is the only title in the list start playback'
				})
			);
		}

		// reject the promise if the mode is not correct
		if(!['replace', 'append', 'append-play'].includes(mode)){
			throw (
				this.errorHandler.errorMessage(1, caller, options ? [source, mode].concat(options) : [source, mode], null, {
					'replace': 'Replace the currently playing title',
					'append': 'Append the title to the playlist',
					'append-play': 'Append the title and when it is the only title in the list start playback'
				})
			);
		}

		// if the source is a URI, leave it as it is. MPV only accepts HTTP URIs, so checking
		// if http is included is sufficient
		// if it's a file, transform the path into the absolute filepath, such that it can be played
		// by any mpv instance, started in any working directory
		source = source.includes('http') ? source : path.resolve(source);

		await new Promise ((resolve, reject) => {
			// socket to observe the command
			const observeSocket = net.Socket();
			observeSocket.connect({path: this.options.socket}, async () =>{
				// send the command to mpv
				await this.command('loadfile', options ? [source, mode].concat(util.formatOptions(options)) : [source, mode]);
				// get the playlist size
				const playlistSize = await this.getPlaylistSize();
				
				// if the mode is append resolve the promise because nothing
				// will be output by the mpv player
				// checking whether this source can be played or not is done when
				// the source is played
				if(mode === 'append'){
					observeSocket.destroy();
					resolve();
				}
				// if the mode is append-play and there are already songs in the playlist
				// resolve the promise since nothing will be output
				if(mode === 'append-play' && playlistSize > 1){
					observeSocket.destroy();
					resolve();
				}

				// timeout
				let timeout = 0;
				// check if the source was started
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
									resolve();
								}
								// when the track has changed we don't need a seek event
								else if (message.event === 'end-file' && started){
									observeSocket.destroy();
									reject(this.errorHandler.errorMessage(0, caller, [source]));
								}
							}
						}
					});
					// reject the promise if it took to long until the playback-restart happens
					// to prevent having sockets listening forever
					if(timeout > 10){						
						observeSocket.destroy();
						reject(this.errorHandler.errorMessage(5, caller, [source]));
					}
				});
			});

		});
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
