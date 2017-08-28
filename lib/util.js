'use strict';

const execSync  = require('child_process').execSync;
const stat = require('fs').stat;

const util = {

	// Finds the correct command to start the IPC socket for mpv. It looks at the
	// output of 'mpv --version' and uses Regular Expressions to determine the mpv
	// version.
	// With mpv version 0.17.0 the command changed from '--input-unix-socket' to
	// '--input-ipc-server'
	//
	// @param binary
	// The binary path for the mpv executable
	//
	// @ return
	// The ipc command flag used by mpv
	//
	findIPCCommand: function(options) {
		// if the ipc Command was set by the user, use that
		if(options.ipc_command){
			if(!(options.ipc_command == '--input-ipc-server' || options.ipc_command == '--input-unix-socket')){
				if(options.debug){console.log('Warning: ipcCommand was neither "--input-unix-socket" nor "--input-ipc-server"')};
				return undefined;
			}
			return options.ipc_command;
		}
		// determine the ipc command according to the version number
		else{
			// the name of the ipc command was changed in mpv version 0.17.0 to '--input-ipc-server'
			// that's why we have to check which mpv version is running
			// asks for the mpv version
			let output = execSync((options.binary ? '"' + options.binary + '"' + ' --version' : 'mpv --version'), {encoding: 'utf8'});

			// Version Number found
			if(output.match(/UNKNOWN/) == null){
				// get the version part of the output
				let start = (output.match(/\d\.*\.*/)).index;
				let end   = (output.match(/\(C\)/)).index;

				// get the version number
				let versionNumber = parseInt(output.substr(start, end).split('.')[1]);

				// with some built packages distributed in some Linux distrubtions
				// the version number is actually a git hash
				// in that case fall back to the old command
				if(isNaN(versionNumber)){
					return '--input-unix-socket';
				}
				// an actually number was found for the version
				else{
					// Verison 0.17.0 and higher
					if(versionNumber >= 17){
						return '--input-ipc-server';
					}
					// Version 0.16.0 and below
					else{
						return '--input-unix-socket';
					}
				}

			}
			// when compiling mpv from source the displayed version number is 'UNKNOWN'
			// I assume that version that is compiled from source is the latest version
			// and use the new command
			else{
				return '--input-ipc-server';
			}
		}
	},
	// Chcks if the  binary passed in by the user actually exists
	// If nothing is passsed in the function is successfully resolved because
	// 'mpv' will be used
	//
	// @param binary {string}
	// Path to the mpv binary
	//
	// @return {pormise}
	//
	checkMpvBinary: function(binary) {
		return new Promise((resolve, reject) => {
			if(binary){
				// check if the binary is actually working
				stat(binary, (err, stats) => {
					// check for the error
					if(err && err.errno == -2){
						reject(`MPV binary ${binary} not found`);
					}
					else{
						resolve();
					}
				});
			}
			// if no binary is passed 'mpv' is used
			else{
				resolve();
			}
		});
	},
	// Merges the options input by the user with the default options, giving
	// the user input options priority
	//
	// @param options
	// node-mpv options object input by the user
	//
	// @ return
	// Merged options object (UserInput with DefaultOptions)
	//
	mergeDefaultOptions: function(userInputOptions) {
		// the default options to start the socket with
		let defaultOptions = {
			debug: false,
			verbose: false,
			// Windows and UNIX defaults
			socket: process.platform === 'win32' ? '\\\\.\\pipe\\mpvserver' : '/tmp/node-mpv.sock',
			audio_only: false,
			auto_restart: true,
			time_update: 1,
			binary: null
		}

		// merge the default options with the one specified by the user
		return Object.assign(defaultOptions, userInputOptions);
	},
	// Determies the properties observed by default
	// If the player is NOT set to audio only, video properties are observed
	// as well
	//
	// @param adioOnlyOption
	// Flag if mpv should be started in audio only mode
	//
	// @return
	// Observed properties object
	//
	observedProperties: function(audioOnlyOption) {
		// basic observed properties
		let basicObserved = {
			mute: false,
			pause: false,
			duration: null,
			volume: 100,
			filename: null,
			path: null,
			'media-title': null,
			'playlist-pos': null,
			'playlist-count': null,
			loop: 'no'
		};

		// video related properties (not required in audio-only mode)
		let observedVideo = {
			fullscreen: false,
			'sub-visibility': false,
		}

		// add the video properties if not set to audio only
		if(!audioOnlyOption){
			basicObserved = Object.assign(basicObserved, observedVideo);
		}

		return basicObserved;
	},
	// Determines the arguments to start mpv with
	// These consist of some default arguments and user input arguments
	// @param options
	// node-mpv options object
	// @param userInputArguments
	// mpv arguments input by the user
	//
	// @return
	// list of arguments for mpv
	mpvArguments: function(options, userInputArguments) {
		// determine the IPC argument
		let ipcCommand = this.findIPCCommand(options);

		// default Arguments
		// --ipcCommand (--ipc-input-server / --input-unix-socket) IPC socket to communicate with mpv
		// --idle always run in the background
		// --really-quite  no console prompts. Buffer might overflow otherwise
		// --msg-level=ipc=v  sets IPC socket related messages to verbose
		let defaultArgs = [ipcCommand + '=' + options.socket, '--idle', '--really-quiet', '--msg-level=ipc=v'];

		//  audio_only option aditional arguments
		// --no-video  no video will be displayed
		// --audio-display  prevents album covers embedded in audio files from being displayed
		if(options.audio_only){
			defaultArgs = [...defaultArgs, ...['--no-video', '--no-audio-display']];
		}

		// add the user specified arguments if specified
		if(userInputArguments){
			// concats the arrays removing duplicates
			defaultArgs = [...new Set([...defaultArgs, ...userInputArguments])]
		}

		return defaultArgs;
	}
}

module.exports = util;
