// the IPC socket to communicate with mpv
var socket = require('./ipcConnection');

// Child Process to module to start mpv player
var spawn = require('child_process').spawn;


function mpv(){

	// status object
	this.status = {
		'playing': false,
		'mute': false,
		'pause': false,
	}

	// observed properties
	// serves as a status object
	this.observed = {};

	// socket file
	var socketFile = 'mpv.sock';

	// default Arguments
	// --no-video    only audio
	// --audio-display prevents album covers embedded in audio files from being displayed
	// --input-ipc-server  IPC socket to communicate with mpv
	//  --idle always run in the background
	//  -quite  no console prompts. Buffer will overflow otherwise
	var defaultArgs = ['--no-video', '--no-audio-display', '--input-ipc-server=' + socketFile, '-idle', '-quiet'];

	// default observed properties
	var defaultObserved = ["mute", "pause", "duration", "volume", "filename", "path", "media-title"];

	// set up socket
	this.socket = new ipcConnection(socketFile);

	// start mpv instance
	this.mpvPlayer = spawn('mpv', defaultArgs);

	// properties observed by default
	var id = 0;
	defaultObserved.forEach(function(property) {
		this.observeProperty(property, id);
		id += 1;
	}.bind(this));
	



	// if mpv crashes restart it again
	this.mpvPlayer.on('close', function() {
		console.log("mpv died, restarting...");
		this.mpvPlayer = spawn('mpv', defaultArgs);
	}.bind(this));

	// if spawn fails to start mpv player
	this.mpvPlayer.on('error', function(error) {
		console.log("mov player not found");
	});
	
	// handles the data received from the IPC socket
	this.socket.on('message', function(data) {
		// handle events
		if(data.event){
			switch(data.event) {
				case "idle":
					this.status.playing = false;
					console.log("idle");
					break;
				case "playback-restart":
					this.status.playing = true;
					console.log("playback");
					break;
				case "pause":
					this.status.playing = false;
					console.log("pause");
					break;
				case "unpause":
					// TODO when no file is loaded this will break;
					this.status.playing = true;
					console.log("unpause");
					break;
				// observed properties
				case "property-change":
					this.observed[data.name] = data.data;
					console.log(`property change ${data.name} ${data.data}`);
					// console.log(this.observed);
					break;
				default:
					console.log(data);
			}
			
		}
		else{
			console.log("Other Event: " + JSON.stringify(data));
		}

	}.bind(this));


}

mpv.prototype = {
	constructor: mpv,
	// loads a file into mpv
	loadFile: function(file) {
		this.socket.command("loadfile", [file, "replace"]);
	},
	// loads a stream into mpv
	loadStream: function(url) {
		this.socket.command("loadfile", [url, "replace"]);
	},
	// toggles pause
	togglePause: function() {
		if(this.observed.pause){
			this.socket.setProperty("pause", false);
		}
		else{
			this.socket.setProperty("pause", true);
		}
	},
	// pause
	pause: function() {
		this.socket.setProperty("pause", true);
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
	// toggles mute
	mute: function() {
		if(this.observed.mute){
			this.socket.setProperty("mute", false);
		}
		else{
			this.socket.setProperty("mute", true);
		}
	},
	// observe a property for changes
	// will be added to event for property changes
	observeProperty: function(property, id) {
		this.socket.command("observe_property", [id, property]);
	},
	// stop observing a property
	unobserveProperty: function(id) {
		this.socket.command("unobserve_property", [id]);
	}
}

mpv = new mpv();
mpv.loadFile("https://www.youtube.com/watch?v=PJ7E40Ec5ec");

mpv.observeProperty("time-pos", 10);