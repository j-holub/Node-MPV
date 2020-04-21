'use strict';

var controls = {
	// toggles pause
	togglePause: function() {
		this.socket.cycleProperty("pause");
	},
	// pause
	pause: function() {
		this.socket.setProperty("pause", true);
	},
	// resume
	resume: function() {
		this.socket.setProperty("pause", false);
	},
	// play
	play: function() {
		this.socket.setProperty("pause", false);
	},
	// stop
	stop: function() {
		this.socket.command("stop", []);
	},
	// quit
	quit: function() {
		// unbind the event listeners
		this.mpvPlayer.removeAllListeners('close');
		this.mpvPlayer.removeAllListeners('error');
		this.mpvPlayer.removeAllListeners('message');
		clearInterval(this.timepositionListenerId);
		// send the quit command to mpv
		this.socket.command("quit");
		// quit the socket connection
		this.socket.quit();
	},
	// volume control values 0-100
	volume: function(value) {
		this.socket.setProperty("volume", value);
	},
	adjustVolume: function(value) {
		this.socket.addProperty("volume", value);
	},
	//  mute
	mute: function() {
		this.socket.setProperty("mute", true);
		if(this.options.debug || this.options.verbose){
			console.log("Warning: mute() has changed with version 0.13.0. Use toggleMute to get the old behaviour");
		}
	},
	// unmute
	unmute: function() {
		this.socket.setProperty("mute", false);
	},
	toggleMute: function() {
		this.socket.cycleProperty("mute");
	},
	//  relative search
	seek: function(seconds) {
		this.socket.command("seek", [seconds, "relative"]);
	},
	// go to position of the song
	goToPosition: function(seconds) {
		this.socket.command("seek", [seconds, "absolute", "exact"]);
	},
	// loops the current track
	// times - number of times the track should be looped. Ifinitely if not set
	loop: function(times="inf") {
		this.socket.setProperty("loop", times);
	},
	// stops looping the current track
	clearLoop: function() {
		this.socket.setProperty("loop", "no");
	}
}

module.exports = controls;
