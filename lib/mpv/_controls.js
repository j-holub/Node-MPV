'use strict';

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
	play: function() {
		return this.setProperty('pause', false);
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
