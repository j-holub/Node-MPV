
// Network Sockets
var net = require('net');
// Child Process to module to start mpv player
var spawn = require('child_process').spawn;



function mpv(){

	// default Arguments
	// --no-video    ony audio
	// --input-ipc-server  IPC socket to communicate with mpv
	//  --idle always run in the background
	//  -quite  no console prompts. Buffer will overflow otherwise
	defaultArgs = ['--no-video', '--input-ipc-server=mpv.sock', '--idle', '-quiet'];

	// start mpv instance
	mpvPlayer = spawn('mpv', defaultArgs);

	// if mpv crashes restart it again
	mpvPlayer.on('close', function() {
		console.log("mpv died, restarting...");
		mpvPlayer = spawn('mpv', defaultArgs);
	});


}