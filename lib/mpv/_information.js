'use strict';

let information = {
	// Shows if the player is muted
	//
	// @return {promise}
	isMuted: function() {
		return this.getProperty('mute');
	},
	// Shows if the player is paused
	//
	// @return {promise}
	isPaused: function() {
		return this.getProperty('pause');
	},
	// Shows if the current title is seekable or not
	// Not fully buffered streams are not for example
	//
	// @return {promise}
	isSeekable: function() {
		return this.getProperty('seekable');
	},



	// Duration of the currently playing song if available
	//
	// @return {promise}
	getDuration: function() {
		return this.getProperty('duration');
	},

	// Current time position of the currently playing song
	//
	// @return {promise}
	getTimePosition: function() {
		return this.getProperty('time-pos');
	},
	// Current time position (in percent) of the currently playing song
	//
	// @return {promise}
	getPercentPosition: function() {
		return this.getProperty('percent-pos');
	},
	// Remaining time for the currently playing song, if available
	//
	// @return {promise}
	getTimeRemaining: function() {
		return this.getProperty('time-remaining');
	},
	// Returns the available metadata for the current track. The output is very dependant
	// on the loaded file
	//
	// @return {promise}
	getMetadata: function() {
		return this.getProperty('metadata');
	},
	// Title of the currently playing song. Might be unavailable
	//
	// @return {promise}
	getTitle: function() {
		return this.getProperty('media-title');
	},
	// Returns the artist of the current song if available
	//
	// @return {promise}
	getArtist: function() {
		return this.getMetadata()
		.then((metadata) => {
			return new Promise((resolve, reject) => {
				if(metadata && metadata.artist){
					resolve(metadata.artist);
				}
				else{
					resolve(undefined);
				}
			});
		});
	},
	// Returns the album title of the current song if available
	//
	// @return {promise}
	getAlbum: function() {
		return this.getMetadata()
		.then((metadata) => {
			return new Promise((resolve, reject) => {
				if(metadata && metadata.album){
					resolve(metadata.album);
				}
				else{
					resolve(undefined);
				}
			});
		});
	},
	// Returns the year of the current song if available
	//
	// @return {promise}
	getYear: function() {
		return this.getMetadata()
		.then((metadata) => {
			return new Promise((resolve, reject) => {
				if(metadata && metadata.date){
					resolve(metadata.date);
				}
				else{
					resolve(undefined);
				}
			});
		});
	},
	// Returns the filename / url of the current track
	//
	// full     - full path or url
	// stripped - stripped path missing the base
	// 
	// @return {promise}
	getFilename: function(format) {
		format = format || 'full';
		return new Promise((resolve, reject) => {
			// reject the promise if the format is not valid
			if(!['stripped', 'full'].includes(format)){
				reject(`'${format}' is not a valid format. Must be one of: \n stripped \n full`);
			}
			// get the information
			else{
				if(format === 'stripped'){
					this.getProperty('filename')
					.then((filename) => {
						resolve(filename);
					});
				}
				else{
					this.getProperty('path')
					.then((path) => {
						resolve(path);
					});
				}
			}
		});
	}
}

module.exports = information;
