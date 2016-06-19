// Child Process to module to start mpv player
var spawn = require('child_process').spawn;
// EventEmitter
var eventEmitter = require('events').EventEmitter;


// Lodash for some nice stuff
var _ = require('lodash');


// the modules with all the member functions
var commandModule = require('./_commands');
var controlModule  = require('./_controls');
var playlistModule  = require('./_playlist');
var audioModule    = require('./_audio');
var videoModule    = require('./_video');
var subtitleModule = require('./_subtitle');
// the IPC socket to communicate with mpv
var socket = require('../ipcInterface');


function mpv(options, mpv_args){

	// intialize the event emitter
	eventEmitter.call(this);


	this.options = {
		"debug": false,
		"verbose": false,
		"socket": "/tmp/node-mpv.sock",
		"audio_only": false
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
		"media-title": null,
		"playlist-pos": null,
		"playlist-count": null
	};
	var observedVideo = {
		"fullscreen": false,
		"sub-visibility": false,
	}
	// saves the IDs of observedProperties with their propertyname
	// key: id  value: property
	this.observedIDs = {};

	// timeposition of the current song
	var currentTimePos = null;

	// default Arguments	
	// --input-ipc-server  IPC socket to communicate with mpv
	//  --idle always run in the background
	//  -quite  no console prompts. Buffer will overflow otherwise
	var defaultArgs = ['--input-ipc-server=' + this.options.socket, '--idle', '--quiet'];

	//  audio_only option aditional arguments
	// --no-video  no video will be displayed
	// --audio-display  prevents album covers embedded in audio files from being displayed
	if( this.options.audio_only){
		defaultArgs = _.concat(defaultArgs, ['--no-video', '--no-audio-display']);
	}
	// add the observed properties only needed for the video version
	else{
		 _.merge(this.observed, observedVideo);
	}

	// add the user specified arguments
	if(mpv_args){
		defaultArgs = _.union(defaultArgs, mpv_args);
	}


	// start mpv instance
	this.mpvPlayer = spawn('mpv', defaultArgs);

	// set up socket
	this.socket = new ipcInterface(this.options);


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
		if(this.options.debug){
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
		if(this.options.debug){
			console.log(error);	
		}
	}.bind(this));
	
	// handles the data received from the IPC socket
	this.socket.on('message', function(data) {
		// handle events
		if(data.hasOwnProperty("event")){

			// if verbose was specified output the event
			// property-changes are output in the statuschange emit
			if(this.options.verbose ){
				if(data.hasOwnProperty("event")){
					if(!(data.event === "property-change")){
						console.log("Message received: " + JSON.stringify(data));
					}
				}
				else{
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
					this.emit("started");
					break;
				case "pause":
					if(this.options.verbose){console.log("Event: pause")};
					// emit paused event
					this.emit("paused");
					break;
				case "unpause":
					if(this.options.verbose){console.log("Event: unpause")};
					// emit unpaused event
					this.emit("resumed");
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

mpv.prototype = _.extend({
	constructor: mpv,

	// loads a file into mpv
	loadFile: function(file) {
		this.socket.command("loadfile", [file, "replace"]);
	},
	// loads a stream into mpv
	loadStream: function(url) {
		this.socket.command("loadfile", [url, "replace"]);
	}

// add all the other modules using lodash 
}, controlModule, commandModule, playlistModule, audioModule, videoModule, subtitleModule, eventEmitter.prototype); // inherit from EventEmitter


// export the mpv class as the module
module.exports = mpv;