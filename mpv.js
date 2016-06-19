// the IPC socket to communicate with mpv
var socket = require('./ipcConnection');

// Child Process to module to start mpv player
var spawn = require('child_process').spawn;
// for inheritence purposes
var util = require('util');
// EventEmitter
var eventEmitter = require('events').EventEmitter;

// Lodash for some nice stuff
var _ = require('lodash');


function mpv(options){

	this.options = {
		"debug": false,
		"verbose": false,
		"socket": "/tmp/node-mpv.sock",
		"audio-only": false
	}

	// merge the default options with the one specified by the user
	this.options = _.defaults(options || {}, this.options);

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

	// default Arguments
	// --no-video    only audio
	// --audio-display prevents album covers embedded in audio files from being displayed
	// --input-ipc-server  IPC socket to communicate with mpv
	//  --idle always run in the background
	//  -quite  no console prompts. Buffer will overflow otherwise
	var defaultArgs = ['--no-video', '--no-audio-display', '--input-ipc-server=' + this.options.socket, '-idle', '-quiet'];

	// set up socket
	this.socket = new ipcConnection(this.options);

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
		if(this.options.verbose){
			console.log("MPV Player seems to have died. Restarting...");
		}
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
		if(data.hasOwnProperty("event")){

			// if verbose was specified output the event
			// property-changes are output in the statuschange emit
			if(this.options.verbose ){
				if(data.hasOwnProperty("event") && !(data.event === "property-change")){
					console.log("Message received: " + JSON.stringify(data));
				}
			}


			switch(data.event) {
				case "idle":
					if(this.options.verbose){console.log("Event: stopped")};
					// emit stopped event
					this.emit("stopped");
					break;
				case "playback-restart":
					if(this.options.verbose){console.log("Event: start")};
					// emit play event
					this.emit("start");
					break;
				case "pause":
					if(this.options.verbose){console.log("Event: pause")};
					// emit paused event
					this.emit("paused");
					break;
				case "unpause":
					if(this.options.verbose){console.log("Event: unpause")};
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
						// emit a status change event
						this.emit('statuschange', this.observed);
						// output if verbose
						if(this.options.verbose){
							console.log("Event: statuschange");
							console.log(`Property change: ${data.name} - ${data.data}`);
						}
						break;
					}
				default:
					
			}
			
		}
		// this API assumes that only get_property requests will have a request_id
		else if(data.hasOwnProperty("request_id")){
			// output if verbose
			if(this.options.verbose){
				console.log(`Get Request: ${data.request_id} - ${data.data}`);
			} 
			// emit a getRequest event
			this.emit("getrequest", data.request_id, data.data);
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
	},

	// will send a get request for the specified property
	// the answer will come via a 'getrequest' event containing the id and data
	getProperty: function(property, id){
		this.socket.getProperty(property, id);
	},
	// set a property specified by the mpv API
	setProperty: function(property, value){
		this.socket.setProperty(property, value);
	},
	// sets all properties defined in the properties Json object
	setMultipleProperties: function(properties){
		Object.keys(properties).forEach(function (property) {
			this.socket.setProperty(property, properties[property]);
		}.bind(this));
	},
	// adds the value to the property
	addProperty: function(property, value){
		this.socket.addProperty(property, value);
	},
	// send a freely writeable command to mpv.
	// the required trailing \n will be added
	command: function(command){
		this.socket.freeCommand(command);
	}
}

// let mpv inhertid from EventEmitter
util.inherits(mpv, eventEmitter);


// export the mpv class as the module
module.exports = mpv;