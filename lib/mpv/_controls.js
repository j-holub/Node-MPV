
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
	//  mute
	mute: function() {
		this.socket.setProperty("mute", true);
		if(this.options.debug || this.options.verbose){
			console.log("Warning: this methods behaviour has changed with version 0.12.3. Use toggleMute to get the old behaviour");
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
	// loop
	// set times to "inf" for infiinite loop
	loop: function(times) {
		this.socket.setProperty("loop", times);
	}
}

module.exports = controls;
