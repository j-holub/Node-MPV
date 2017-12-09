'use strict';
// lodash
var _ = require('lodash');


var subtitle = {

	// add subtitle file
	// file path to the subtitle file
	// flag select / auto /cached
	// title subtitle title in the UI
	// lang subitlte language
	addSubtitles: function(file, flag, title, lang) {
		var args = [file];
		// add the flag if specified
		if(flag){ args = _.concat(args, flag)};
		// add the title if specified
		if(title){ args = _.concat(args, title)};
		// add the language if specified
		if(lang){ args = _.concat(args, lang)};
		// finally add the argument
		this.socket.command("sub-add", args);
	},
	// delete subtitle specified by the id
	removeSubtitles: function(id) {
		this.socket.command("sub-remove", [id]);
	},
	// cycle through subtitles
	cycleSubtitles: function() {
		this.socket.cycleProperty("sub");
	},
	// selects subitle according to the id
	selectSubtitles: function(id) {
		this.socket.setProperty("sub", id);
	},
	// selects subitle according to the id
	selectSubtitle: function(id) {
		console.log('Warning: selectSubtitle() is deprecated. Use selectSubtitles() instead');
		this.socket.setProperty("sub", id);
	},
	// toggle subtitle visibility
	toggleSubtitleVisibility: function() {
		this.socket.cycleProperty("sub-visibility");
	},
	// shows selected subtitle
	showSubtitles: function() {
		this.socket.setProperty("sub-visibility", true);
	},
	// hides subtitles
	hideSubtitles: function() {
		this.socket.setProperty("sub-visibility", false);
	},
	// adjusts the subtitles timing
	adjustSubtitleTiming: function(seconds){
		this.socket.setProperty("sub-delay", seconds);
	},
	// jumps linesToSkip many lines forward in the video
	subtitleSeek: function(lines) {
		this.socket.command("sub-seek", [lines]);
	},
	// scales to font size of the subtitles
	subtitleScale: function(scale) {
		this.setProperty("sub-scale", scale);
	},
	// displays ASS subtitle calls
	displayASS: function(ass, duration, position=7) {
		let assCommand ={
			'command': [
				'expand-properties',
				'show-text',
				`\${osd-ass-cc/0}{\\an${position}}${ass}`,
				duration
			]
		}
		this.commandJSON(assCommand);
	}

}

module.exports = subtitle;
