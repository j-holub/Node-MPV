'use strict';

const controls = {
	// toggles pause
	togglePause: function() {
		return this.socket.cycleProperty('pause');
	},
	// pause
	pause: function() {
		return this.socket.setProperty('pause', true);
	},
	// resume
	resume: function() {
		return this.socket.setProperty('pause', false);
	},
	// play
	play: function() {
		return this.socket.setProperty('pause', false);
	},
	// stop
	stop: function() {
		return this.socket.command('stop', []);
	},
	// volume control values 0-100
	volume: function(value) {
		return this.socket.setProperty('volume', value);
	},
	adjustVolume: function(value) {
		return this.socket.addProperty('volume', value);
	},
	//  mute
	mute: function() {
		return this.socket.setProperty('mute', true);
	},
	// unmute
	unmute: function() {
		return this.socket.setProperty('mute', false);
	},
	toggleMute: function() {
		return this.socket.cycleProperty('mute');
	},
	//  relative search
	seek: function(seconds) {
		return this.socket.command('seek', [seconds, 'relative']);
	},
	// go to position of the song
	goToPosition: function(seconds) {
		return this.socket.command('seek', [seconds, 'absolute', 'exact']);
	},
	// loop
	// set times to 'inf' for infinite loop
	loop: function(times) {
		return this.socket.setProperty('loop', times);
	}
}

module.exports = controls;
