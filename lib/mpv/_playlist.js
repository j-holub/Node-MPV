'use strict';

const net = require('net');

const playlist = {
	// load a playlist file
	// mode
	// replace  replace current playlist
	// append append to current playist
	loadPlaylist: function(playlist, mode = 'replace'){
		this.socket.command('loadlist', [playlist, mode]);
	},
	// appends a video/song to the playlist
	// mode
	// append          append the song
	// append-play  append and play if the playlist was empty
	append: function(file, mode = 'append'){
		return this.load(file, mode);
	},
	// next song in the playlist
	// mode  weak  last song in the playlist will not be skipped
	// mode  force last song in the playlist will be skipped
	next: function(mode = 'weak') {
		return this.getProperty(`playlist/${this.observed['playlist-pos']+1}/filename`)
		.then((nextTrackFile) => { return new Promise((resolve, reject) => {

			// reject the promise if the mode is not correct
			if(!['weak', 'force'].includes(mode)){
				reject(`'${mode}' is not a valid mode. Must be one of: \n weak \n strong`);
			}
			// if there is no next track resolve to promise to continue the chain
			if(nextTrackFile == undefined && mode === 'weak'){
				resolve(false)
			}

			// socket to observe the command
			let observeSocket = net.Socket();
			observeSocket.connect({path: this.options.socket}, () =>{
				// send the command to mpv
				this.socket.command('playlist-next', [mode]);
				// timeout
				let timeout = 0;
				// check if the file was started
				let started = false;

				observeSocket.on('data', (data) => {
					// increase timeout
					timeout += 1;
					// parse the messages from the socket
					let messages = data.toString('utf-8').split('\n');
					// check every message
					messages.forEach((message) => {
						// ignore empty messages
						if(message.length > 0){
							message = JSON.parse(message);
							if('event' in message){
								if(message.event === 'start-file'){
									started = true;
								}
								// when the file has been successfully loaded resolve the promise
								else if(message.event === 'playback-restart' && started) {
									// resolve the promise
									resolve(true);
								}
								// reject the promise if the file could not be loaded
								else if (message.event === 'end-file' && started) {
									reject(`Unable to load file '${nextTrackFile}'`);
								}
								// if mode was set to force and it was the last track playback is stopped
								// resolve the promise
								else if (message.event === 'end-file' && mode === 'force') {
									resolve(true);
								}
							}
						}
					});
					// reject the promise if it took to long until the playback-restart happens
					// to prevent having sockets listening forever
					if(timeout > 10){
						reject('Loadfile timeout');
					}
				});
			});
		});
		});

	},
	// previous song in the playlist
	// mode  weak  first song in the playlist will not be skipped
	// mode  force first song in the playlist will be skipped
	prev: function(mode = 'weak') {
		return this.getProperty(`playlist/${this.observed['playlist-pos']-1}/filename`)
		.then((prevTrackFile) => { return new Promise((resolve, reject) => {

			// reject the promise if the mode is not correct
			if(!['weak', 'force'].includes(mode)){
				reject(`'${mode}' is not a valid mode. Must be one of: \n weak \n strong`);
			}
			// if there is no next track resolve to promise to continue the chain
			if(prevTrackFile == undefined && mode === 'weak'){
				resolve(false)
			}

			// socket to observe the command
			let observeSocket = net.Socket();
			observeSocket.connect({path: this.options.socket}, () =>{
				// send the command to mpv
				this.socket.command('playlist-prev', [mode]);
				// timeout
				let timeout = 0;
				// check if the file was started
				let started = false;

				observeSocket.on('data', (data) => {
					// increase timeout
					timeout += 1;
					// parse the messages from the socket
					let messages = data.toString('utf-8').split('\n');
					// check every message
					messages.forEach((message) => {
						// ignore empty messages
						if(message.length > 0){
							message = JSON.parse(message);
							if('event' in message){
								if(message.event === 'start-file'){
									started = true;
								}
								// when the file has been successfully loaded resolve the promise
								else if(message.event === 'playback-restart' && started) {
									// resolve the promise
									resolve(true);
								}
								// reject the promise if the file could not be loaded
								else if (message.event === 'end-file' && started) {
									reject(`Unable to load file '${prevTrackFile}'`);
								}
								// if mode was set to force and it was the first track playback is stopped
								// resolve the promise
								else if (message.event === 'end-file' && mode === 'force') {
									resolve(true);
								}
							}
						}
					});
					// reject the promise if it took to long until the playback-restart happens
					// to prevent having sockets listening forever
					if(timeout > 10){
						reject('Loadfile timeout');
					}
				});
			});
		});
		});
	},
	// clear the playlist
	clearPlaylist: function() {
		this.socket.command('playlist-clear');
	},
	// remove the song at index or the current song, if index = 'current'
	playlistRemove: function(index) {
		this.socket.command('playlist-remove', [index]);
	},
	// Moves the song/video on position index1 to position index2
	playlistMove: function(index1, index2) {
		this.socket.command('playlist-move', [index1, index2]);
	},
	// shuffle the playlist
	shuffle: function() {
		this.socket.command('playlist-shuffle');
	},


	// returns the playlist size (as a promise)
	getPlaylistSize: function() {
		return this.getProperty('playlist-count');
	},
	// returns the current playlist position (as a promise) 0 based
	getPlaylistPosition: function() {
		return this.getProperty('playlist-pos');
	},
	// returns the current playlist position (as a promise) 1f based
	getPlaylistPosition1: function() {
		return this.getProperty('playlist-pos-1');
	}


}

module.exports = playlist;
