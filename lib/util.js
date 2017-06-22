var exec  = require('child_process').execSync;

// Lodash for some nice stuff
var _ = require('lodash');

var util = {

	// Finds the correct command to start the IPC socket for mpv. It looks at the
	// output of 'mpv --version' and uses Regular Expressions to determine the mpv
	// version.
	// With mpv version 0.17.0 the command changed from "--input-unix-socket" to
	// "--input-ipc-server"
	//
	// @param binary
	// The binary path for the mpv executable
	//
	// @ return
	// The ipc command flag used by mpv
	//
	findIPCCommand: function(binary) {


		// the name of the ipc command was changed in mpv version 0.17.0 to "--input-ipc-server"
		// that's why we have to check which mpv version is running
		// asks for the mpv version
		var output = exec((binary ? binary + " --version" : "mpv --version"), {encoding: 'utf8'});

		// Version Number found
		if(output.match(/UNKNOWN/) == null){
			// get the version part of the output
			var start = (output.match(/\d\.*\.*/)).index;
			var end   = (output.match(/\(C\)/)).index;

			// get the version number
			var versionNumber = parseInt(output.substr(start, end).split('.')[1]);

			// with some built packages distributed in some Linux distrubtions
			// the version number is actually a git hash
			// in that case fall back to the old command
			if(isNaN(versionNumber)){
				return "--input-unix-socket";
			}
			// an actually number was found for the version
			else{
				// Verison 0.17.0 and higher
				if(versionNumber >= 17){
					return "--input-ipc-server";
				}
				// Version 0.16.0 and below
				else{
					return "--input-unix-socket";
				}
			}

		}
		// when compiling mpv from source the displayed version number is "UNKNOWN"
		// I assume that version that is compiled from source is the latest version
		// and use the new command
		else{
			return "--input-ipc-server";
		}

	},
	// Merges the options input by the user with the default options, giving
	// the user input options priority
	//
	// @param options
	// options object
	//
	// @ return
	// Merged options object (UserInput with DefaultOptions)
	//
	mergeDefaultOptions: function(userInputOptions) {
		// the default options to start the socket with
		let defaultOptions = {
			"debug": false,
			"verbose": false,
			// Windows and UNIX defaults
			"socket": process.platform === "win32" ? "\\\\.\\pipe\\mpvserver" : "/tmp/node-mpv.sock",
			"audio_only": false,
			"time_update": 1,
			"binary": null
		}
		// merge the default options with the one specified by the user
		return _.defaults(userInputOptions || {}, defaultOptions);
	}

}

module.exports = util;
