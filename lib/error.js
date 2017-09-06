'use strict';

const ErrorHandler = class {

	constructor () {
		this.messageDict = {
			0: 'Unable to load file or stream',
			1: 'Invalid argument',
			2: 'Binary not found',
			3: 'ipcCommand invalid',
			4: 'Unable to bind IPC socket',
			5: 'Timeout',
			6: 'MPV is already running'
		}
	}


	errorMessage(errorCode, target, method, possibleArgs){

		let errorObject = {
			'errcode': errorCode,
			'message': this.messageDict[errorCode],
			'target': target,
			'method': method
		};

		if(possibleArgs){
			errorObject = Object.assign(errorObject, {
				'possibleArguments': possibleArgs
			});
		}

		return errorObject;

	}

}

module.exports = ErrorHandler;
