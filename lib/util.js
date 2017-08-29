'use strict';

const exec  = require('child_process').exec;
const stat = require('fs').stat;

const ErrorHandler = require('./error');

const util = {

	// Finds the correct command to start the IPC socket for mpv. It looks at the
	// output of 'mpv --version' and uses Regular Expressions to determine the mpv
	// version.
	// With mpv version 0.17.0 the command changed from '--input-unix-socket' to
	// '--input-ipc-server'
	//
	// @param options
	// options object
	//
	// @ return {promise}
	// Resolves to the command
	//
	findIPCCommand: function(options) {
		return new Promise((resolve, reject) => {

			// if the ipc Command was set by the user, use that
			if(options.ipc_command){
				// check if the command is correct
				if(!['--input-ipc-server', '--input-unix-socket'].includes(options.ipc_command)){
					reject(new ErrorHandler().errorMessage(3, options.ipc_command, 'start()', {
							'--input-unix-socket': 'mpv 0.16.0 and below',
							'--input-ipc-server':  'mpv 0.17.0 and above'
						}
					));
				}
				else{
					resolve(options.ipc_command)
				}
			}
			// determine the ipc command according to the version number
			else{
				// the name of the ipc command was changed in mpv version 0.17.0 to '--input-ipc-server'
				// that's why we have to check which mpv version is running
				// asks for the mpv version
				exec((options.binary ? '"' + options.binary + '"' + ' --version' : 'mpv --version'), {encoding: 'utf8'}, (err, stdout, stderr) => {

					// if any error occurs reject it
					if(err){
						return reject(err);
					}

					// Version Number found
					if(stdout.match(/UNKNOWN/) == null){
						// get the version part of the stdout
						const start = (stdout.match(/\d\.*\.*/)).index;
						const end   = (stdout.match(/\(C\)/)).index;

						// get the version number
						const versionNumber = parseInt(stdout.substr(start, end).split('.')[1]);

						// with some built packages distributed in some Linux distrubtions
						// the version number is actually a git hash
						// in that case fall back to the old command
						if(isNaN(versionNumber)){
							resolve('--input-unix-socket');
						}
						// an actually number was found for the version
						else{
							// Verison 0.17.0 and higher
							if(versionNumber >= 17){
								resolve('--input-ipc-server');
							}
							// Version 0.16.0 and below
							else{
								resolve('--input-unix-socket');
							}
						}

					}
					// when compiling mpv from source the displayed version number is 'UNKNOWN'
					// I assume that version that is compiled from source is the latest version
					// and use the new command
					else{
						resolve('--input-ipc-server');
					}
				})
			}
		});
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
						returnreject(new ErrorHandler().errorMessage(2, binary, 'start()'));
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
		const observedVideo = {
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

		// default Arguments
		// --idle always run in the background
		// --really-quite  no console prompts. Buffer might overflow otherwise
		// --msg-level=ipc=v  sets IPC socket related messages to verbose
		let defaultArgs = ['--idle', '--really-quiet', '--msg-level=ipc=v'];

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
