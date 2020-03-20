'use strict';

const net = require('net');

const controls = {
	// toggles pause
	togglePause: function() {
		return this.cycleProperty('pause');
	},
	// pause
	pause: function() {
		return this.setProperty('pause', true);
	},
	// resume
	resume: function() {
		return this.setProperty('pause', false);
	},
	// play
	play: async function() {
		const idle = await this.getProperty('idle-active')
		const playlist_size = await this.getPlaylistSize();
		// if mpv is idle but has a playlist, set playlist-pos to 0,
		// which starts the playback
		if(idle && playlist_size > 0){
			return new Promise(async (resolve, reject) => {
				// get the filename of the first item in the playlist for error handling purposes
				const fname = await this.getProperty('playlist/0/filename');

				let started = false;
				// socket to observe if the file is being played back
				const observeSocket = new net.Socket();
				observeSocket.connect({path: this.options.socket}, async () => {
					// this starts the playback when mpv is idle but songs are queued in the playlist
					await this.setProperty('playlist-pos', 0);
				}).on('data', (data) => {
					// parse the messages from the socket
					const messages = data.toString('utf-8').split('\n');
					// check every message
					messages.forEach((message) => {
						// ignore empty messages
						if(message.length > 0){
							message = JSON.parse(message);
							// look for the file-loaded event to see if the file was loaded and is played 
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
									return reject(this.errorHandler.errorMessage(0, 'play()', [fname]));
								}
							}
						}
					});
				});
			});
		}
		// if mpv is not idle and has files queued just set the pause state to false
		else{
			return this.setProperty('pause', false);
		} 
	},
	// stop
	stop: function() {
		return this.command('stop', []);
	},
	// volume control values 0-100
	volume: function(value) {
		return this.setProperty('volume', value);
	},
	adjustVolume: function(value) {
		return this.addProperty('volume', value);
	},
	//  mute
	mute: function() {
		return this.setProperty('mute', true);
	},
	// unmute
	unmute: function() {
		return this.setProperty('mute', false);
	},
	toggleMute: function() {
		return this.cycleProperty('mute');
	},
	//  relative search
	seek: function(seconds) {
		return this.command('seek', [seconds, 'relative']);
	},
	// go to position of the song
	goToPosition: function(seconds) {
		return this.command('seek', [seconds, 'absolute', 'exact']);
	},
	// loop
	// set times to 'inf' for infinite loop
	loop: function(times) {
		return this.setProperty('loop', times);
	}
}

module.exports = controls;
