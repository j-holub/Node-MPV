// the IPC socket to communicate with mpv
var socket = require('./ipcConnection');

// Child Process to module to start mpv player
var spawn = require('child_process').spawn;


function mpv(){

	// status object
	this.status = {
		'playing': false,
	}

	// socket file
	var socketFile = 'mpv.sock';

	// default Arguments
	// --no-video    ony audio
	// --input-ipc-server  IPC socket to communicate with mpv
	//  --idle always run in the background
	//  -quite  no console prompts. Buffer will overflow otherwise
	var defaultArgs = ['--no-video', '--input-ipc-server=' + socketFile, '-idle', '-quiet'];

	// set up socket
	this.socket = new ipcConnection(socketFile);

	// start mpv instance
	this.mpvPlayer = spawn('mpv', defaultArgs);

	// if mpv crashes restart it again
	this.mpvPlayer.on('close', function() {
		console.log("mpv died, restarting...");
		this.mpvPlayer = spawn('mpv', defaultArgs);
	});
	
	// handles the data received from the IPC socket
	this.socket.on('message', function(data) {
		// handle events
		if(data.event){
			switch(data.event) {
				case "idle":
					this.status.playing = false;
					console.log("idleidleidle");
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
					console.log("pause");
					break;
				default:
					console.log(data);
			}
			
		}

	}.bind(this));

}

player = new mpv();