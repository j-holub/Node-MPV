// the IPC socket to communicate with mpv
var socket = require('./ipcConnection');

// Child Process to module to start mpv player
var spawn = require('child_process').spawn;
// for inheritence purposes
var util = require('util');
// EventEmitter
var eventEmitter = require('events').EventEmitter;



function mpv(){

	// observed properties
	// serves as a status object
	// can be enhanced by using the observeProperty function
	this.observed = {
		"mute": false,
		"pause": false,
		"duration": null,
		"volume": 100,
		"filename": null,
		"path": null,
		"media-title": null
	};

	// saves the IDs of observedProperties with their propertyname
	// key: id  value: property
	this.observedIDs = {};

	// timeposition of the current song
	var currentTimePos = null;

	// socket file
	var socketFile = 'mpv.sock';

	// default Arguments
	// --no-video    only audio
	// --audio-display prevents album covers embedded in audio files from being displayed
	// --input-ipc-server  IPC socket to communicate with mpv
	//  --idle always run in the background
	//  -quite  no console prompts. Buffer will overflow otherwise
	var defaultArgs = ['--no-video', '--no-audio-display', '--input-ipc-server=' + socketFile, '-idle', '-quiet'];

	// set up socket
	this.socket = new ipcConnection(socketFile);

	// start mpv instance
	this.mpvPlayer = spawn('mpv', defaultArgs);


	// sets the Interval to emit the current time position
	this.socket.command("observe_property", [0, "time-pos"]);
	setInterval(function() {
		// only emit the time position if there is a file playing and it's not paused
		if(this.observed.filename && !this.observed.pause && currentTimePos != null){
			this.emit("timeposition", currentTimePos);
		}
	}.bind(this), 980);

	

	// private member method
	// will observe all properties defined in the observed JSON dictionary
	var observeProperties = function() {
		var id = 1;
		// for every property stored in observed
		Object.keys(this.observed).forEach(function (property) {
			// safety check
			if(this.observed.hasOwnProperty(property)){
				this.observeProperty(property, id);
				this.observedIDs[id] = property;
				id += 1;
			}
		}.bind(this));
	}.bind(this);
	// observe all properties defined by default
	observeProperties();



	// ### Events ###

	// if mpv crashes restart it again
	this.mpvPlayer.on('close', function() {
		console.log("mpv died, restarting...");
		this.mpvPlayer = spawn('mpv', defaultArgs);
		// TODO: reset ALL default parameters
		currentTimePos = null;
		// a small timeout is required to wait for mpv to have restarted
		// on weak machines this could take a while, thus 1000ms
		setTimeout(function() {
			// reobserve all observed properties
			// this will include those added by the user
			observeProperties();
			// observe timeposition
			this.socket.command("observe_property", [0, "time-pos"]);
		}.bind(this), 1000);
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
					console.log("idle");
					// emit stopped event
					this.emit("stopped");
					break;
				case "playback-restart":
					console.log("playback");
					// emit play event
					this.emit("play");
					break;
				case "pause":
					console.log("pause");
					// emit paused event
					this.emit("paused");
					break;
				case "unpause":
					console.log("unpause");
					// emit unpaused event
					this.emit("unpaused");
					break;
				// observed properties
				case "property-change":
					// time position events are handled seperately
					if(data.name === "time-pos"){
						// set the current time position
						currentTimePos = data.data;
						break;
					}
					else{
						// updates the observed value or adds it, if it was previously unobserved
						this.observed[data.name] = data.data;
						console.log(`property change ${data.name} ${data.data}`);
						// emit a status change event
						this.emit('statuschange', this.observed);
						break;
					}
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
	adjustVolume: function(value) {
		this.socket.addProperty("volume", value);
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
	//  relative search 
	seek: function(seconds){
		this.socket.command("seek", [seconds, "relative"]);
	},
	// go to position of the song
	goToPosition: function(seconds){
		this.socket.command("seek", [seconds, "absolute", "exact"]);
	},


	// observe a property for changes
	// will be added to event for property changes
	observeProperty: function(property, id) {
		this.observed[property] = null;
		this.observedIDs[id] = property;
		this.socket.command("observe_property", [id, property]);
	},
	// stop observing a property
	unobserveProperty: function(id) {
		delete this.observed[this.observedIDs[id]];
		delete this.observedIDs[id];
		this.socket.command("unobserve_property", [id]);
	}
}

// let mpv inhertid from EventEmitter
util.inherits(mpv, eventEmitter);