'use strict';

const subtitle = {

	// add subtitle file
	// file path to the subtitle file
	// flag select / auto /cached
	// title subtitle title in the UI
	// lang subitlte language
	addSubtitles: function(file, flag, title, lang) {
		let args = [file];
		// add the flag if specified
		if(flag){  args = [...args, flag]};
		// add the title if specified
		if(title){ args = [...args, title]};
		// add the language if specified
		if(lang){  args = [...args, lang]};
		// finally add the argument
		return this.socket.command('sub-add', args);
	},
	// delete subtitle specified by the id
	removeSubtitles: function(id) {
		return this.socket.command('sub-remove', [id]);
	},
	// cycle through subtitles
	cycleSubtitles: function() {
		return this.socket.cycleProperty('sub');
	},
	// selects subitle according to the id
	selectSubtitle: function(id) {
		return this.socket.setProperty('sub', id);
	},
	// toggle subtitle visibility
	toggleSubtitleVisibility: function() {
		return this.socket.cycleProperty('sub-visibility');
	},
	// shows selected subtitle
	showSubtitles: function() {
		return this.socket.setProperty('sub-visibility', true);
	},
	// hides subtitles
	hideSubtitles: function() {
		return this.socket.setProperty('sub-visibility', false);
	},
	// adjusts the subtitles timing
	adjustSubtitleTiming: function(seconds){
		return this.socket.setProperty('sub-delay', seconds);
	},
	// jumps linesToSkip many lines forward in the video
	subtitleSeek: function(lines) {
		return this.socket.command('sub-seek', [lines]);
	},
	// scales to font size of the subtitles
	subtitleScale: function(scale) {
		return this.setProperty('sub-scale', scale);
	}

}

module.exports = subtitle;
