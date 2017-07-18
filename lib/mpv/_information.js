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

	// Title of the currently playing song. Might be unavailable
	//
	// @return {promise}
	getCurrentTitle: function() {
		return this.getProperty('media-title');
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
	}
}

module.exports = information;
