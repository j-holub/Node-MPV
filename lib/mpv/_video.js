
video = {
	// goes into fullscreen
	fullscreen: function() {
		this.socket.setProperty("fullscreen", true);
	},
	// leaves fullscreen
	leaveFullscreen: function() {
		this.socket.setProperty("fullscreen", false);
	},
	// toggles fullscreen
	toggleFullscreen: function() {
		this.socket.cycleProperty("fullscreen");
	},
	// takes a screenshot
	// option subtitles / video / window
	screenshot: function(file, option){
		var args = [file];
		if(option){args = _.concat(args, option)};
		this.command("screenshot-to-file", args);
	}
}

module.exports = video;