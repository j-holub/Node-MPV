
controls = {
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
	// volume control values 0-100
	volume: function(value) {
		this.socket.setProperty("volume", value);
	},
	adjustVolume: function(value) {
		this.socket.addProperty("volume", value);
	},
	// toggles mute
	mute: function() {
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
	// loop
	// set times to "inf" for infiinite loop
	loop: function(times) {
		this.socket.setProperty(times);
	}
}

module.exports = controls;