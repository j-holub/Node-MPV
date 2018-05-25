'use strict';

const net = require('net');
const stat = require('fs').stat;

const playlist = {
	// load a playlist file
	// mode
	// replace  replace current playlist
	// append append to current playist
	loadPlaylist: function(playlist, mode = 'replace'){
		return new Promise((resolve, reject) => {
			// check for the mode paramter
			if(!['replace', 'append'].includes(mode)){
				return reject(this.errorHandler.errorMessage(1, 'loadPlaylist()', [playlist, mode], null, {
					'replace': 'replace the current playlist (default)',
					'append':  'append to the current playlist'
				}));
			}

			// check if the playlistfile exists
			stat(playlist, (err, stats) => {
				if(err && err.errno == -2){
					return reject(this.errorHandler.errorMessage(0, 'loadPlaylist()', [playlist]));
				}
				else{
					return resolve();
				}
			});
		})
		.then(() => { return new Promise((resolve, reject) => {
			// socket to observe the command
			let observeSocket = net.Socket();
			observeSocket.connect({path: this.options.socket}, () =>{
				// send the command to mpv
				this.socket.command('loadlist', [playlist, mode]);

				// if the mode is append resolve the promise because nothing
				// will be output by the mpv player
				// checking whether this files in hte list can be played or not is done when
				// the file is played
				if(mode === 'append'){
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
								// when the file has successfully been loaded resolve the promise
								else if(message.event === 'file-loaded' && started){
									observeSocket.destroy();
									// resolve the promise
									return resolve();
								}
								// when the track has changed we don't need a seek event
								else if (message.event === 'end-file' && started){
									observeSocket.destroy();
									// get the filename of the not playable song
									this.getProperty(`playlist/0/filename`)
									.then((filename) => {
										return reject(this.errorHandler.errorMessage(0, 'loadPlaylist()', [filename]));
									})
								}
							}
						}
					});
					// reject the promise if it took to long until the playback-restart happens
					// to prevent having sockets listening forever
					if(timeout > 10){
						observeSocket.destroy();
						reject(this.errorHandler.errorMessage(5, 'loadPlaylist()'));
					}
				});
			});
		});
		});
	},
	// appends a video/song to the playlist
	// mode
	// append       append the song
	// append-play	append and play if the playlist was empty
	//
	// options
	// further options
	append: function(file, mode = 'append', options){
		return this.load(file, mode, options);
	},
	// next song in the playlist
	// mode
	// weak  	last song in the playlist will NOT be skipped
	// force	last song in the playlist will be skipped
	next: function(mode = 'weak') {
		return new Promise((resolve, reject) => {
			// reject the promise if the mode is not correct
			if(!["weak", "force"].includes(mode)){
				return reject(this.errorHandler.errorMessage(1, 'next()', [mode], null, {
					'weak':  'last song in the playlist will not be skipped (default)',
					'force': 'last song in the playlist will be skipped'
				}));
			}
			else{
				// check if there's more than one song in the playlist
				// get the current position in the playlist
				this.getPlaylistPosition1()
				.then((position) => {
					// geht the playlist size
					this.getPlaylistSize()
					.then((size) => {
						// check if it was the last track in the playlist
						// if the mode was set to weak nothing has to happen
						// return false to show that the track was not skipped
						if(size == position && mode === 'weak'){
							return resolve(false);
						}
						// if we have the last track but mode is not set to 'weak' (i.e. 'force')
						// we can just stop the playback, that is the same
						else if (size == position) {
							// stop playback
							return this.stop()
							.then(() => {
								return resolve(true);
							});
						}
						// continue the skipping process
						else{
							// get the next song in the playlist for possible error messages
							return this.getProperty(`playlist/${this.observed['playlist-pos']+1}/filename`)
							.then((nextTrackFile) => {
								// socket to observe the command
								const observeSocket = net.Socket();
								observeSocket.connect({path: this.options.socket}, () =>{
									// send the skip command to mpv
									this.socket.command('playlist-next', [mode])
									.then(() => {
										// timeout
										let timeout = 0;
										// check if the file was started
										let started = false;

										// listen for events
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
														// when the file has been successfully loaded resolve the promise
														else if(message.event === 'playback-restart' && started) {
															observeSocket.destroy();
															// resolve the promise
															return resolve(true);
														}
														// reject the promise if the file could not be loaded
														else if (message.event === 'end-file' && started) {
															observeSocket.destroy();
															return reject(this.errorHandler.errorMessage(0, 'next()', [nextTrackFile]));
														}
													}
												}
											});
											// reject the promise if it took to long until the playback-restart happens
											// to prevent having sockets listening forever
											if(timeout > 10){
												observeSocket.destroy();
												return reject(this.errorHandler.errorMessage(5, 'next()', [nextTrackFile]));
											}
										});
									})
									// catch errors
									.catch((error) => {
										if(this.options.debug){
											console.log(error);
										}
									})
								});
							});
						}
					});
				})

			}

		});

	},
	// previous song in the playlist
	// mode
	// weak 	first song in the playlist will not be skipped
	// force	first song in the playlist will be skipped
	prev: function(mode = 'weak') {
		return new Promise((resolve, reject) => {
			// reject the promise if the mode is not correct
			if(!["weak", "force"].includes(mode)){
				return reject(this.errorHandler.errorMessage(1, mode, 'prev()', null, {
					'weak':  'first song in the playlist will not be skipped (default)',
					'force': 'first song in the playlist will be skipped'
				}));
			}
			else{
				this.getPlaylistPosition1()
				.then((position) => {
					// first song in the playlist and 'weak' means we do nothing
					if(position == 1 && mode === 'weak'){
						return resolve(false);
					}
					// mode is not set to 'weak' but 'force'
					else if (position == 1){
						// stop the playback
						return this.stop()
						.then(() => {
							return resolve(true);
						});
					}
					// continue the skipping process
					else{
						// get the name of the previous file
						return this.getProperty(`playlist/${this.observed['playlist-pos']-1}/filename`)
						.then((prevTrackFile) => { return new Promise((resolve, reject) => {
							// socket to observe the command
							const observeSocket = net.Socket();
							observeSocket.connect({path: this.options.socket}, () =>{
								// send the prev command to mpv
								this.socket.command('playlist-prev', [mode])
								.then(() => {
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
													// when the file has been successfully loaded resolve the promise
													else if(message.event === 'playback-restart' && started) {
														observeSocket.destroy();
														// resolve the promise
														return resolve(true);
													}
													// reject the promise if the file could not be loaded
													else if (message.event === 'end-file' && started) {
														observeSocket.destroy();
														return reject(this.errorHandler.errorMessage(0, prevTrackFile, 'prev()'));
													}
												}
											}
										});
										// reject the promise if it took to long until the playback-restart happens
										// to prevent having sockets listening forever
										if(timeout > 10){
											observeSocket.destroy();
											return reject(this.errorHandler.errorMessage(5, null, 'prev()'));
										}
									});
								});
							});
						});
						});
					}
				});
			}
		});
	},
	// clear the playlist
	clearPlaylist: function() {
		return this.socket.command('playlist-clear');
	},
	// remove the song at index or the current song, if index = 'current'
	playlistRemove: function(index) {
		return this.socket.command('playlist-remove', [index]);
	},
	// Moves the song/video on position index1 to position index2
	playlistMove: function(index1, index2) {
		return this.socket.command('playlist-move', [index1, index2]);
	},
	// shuffle the playlist
	shuffle: function() {
		return this.socket.command('playlist-shuffle');
	},


	// returns the playlist size (as a promise)
	getPlaylistSize: function() {
		return this.getProperty('playlist-count');
	},
	// returns the current playlist position (as a promise) 0 based
	getPlaylistPosition: function() {
		return this.getProperty('playlist-pos');
	},
	// returns the current playlist position (as a promise) 1 based
	getPlaylistPosition1: function() {
		return this.getProperty('playlist-pos-1');
	}


}

module.exports = playlist;
