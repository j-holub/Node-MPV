
playlist = {
	// load a playlist file
	// mode  "replace" / "append"
	loadPlaylist(playlist, mode="replace"){
		this.socket.command("loadlist", [playlist, mode]);
	},

	// next song in the playlist
	// mode  weak  last song in the playlist will not be skipped
	// mode strong last song in the playlist will be skipped
	next: function(mode="weak") {
		this.socket.command("playlist-next");
	},
	// previous song in the playlist
	// mode  weak  first song in the playlist will not be skipped
	// mode strong first song in the playlist will be skipped
	prev: function(mode="weak") {
		this.socket.command("playlist-prev");
	},
	// clear the playlist
	clearPlaylist: function() {
		this.socket.command("playlist-clear");
	},
	// remove the song at index or the current song, if index = "current"
	playlistRemove: function(index) {
		this.socket.command("playlist-remove", [index]);
	},
	// Moves the song/video on position index1 to position index2
	playlistMove: function(index1, index2) {
		this.socket.command("playlist-move", [index1, index2]);
	},
	// shuffle the playlist
	shuffle: function() {
		this.socket.command("playlist-shuffle");
	}



}

module.exports = playlist;