# Migration Guide for Version 2

If you've been using *Version 1* of **Node-MPV** here's how you can migrate your app to *Version 2*

Be sure to also check the Async/Await version at the bottom.

## Starting MPV

In *Version 1* you didn't need to explicitly have to start the player, in *Version 2* you do.

### Version 1 Code
``` JavaScript
const mpvAPI = require('node-mpv');
const mpv = new mpvAPI();

// player is running
```
This didn't check at all if everything worked out, like binding the IPC socket or if the provided mpv binary actually existed.

### Version 2 Code
``` JavaScript
const mpvAPI = require('node-mpv');
const mpv = new mpvAPI();
// player is NOT running yet

mpv.start()
.then(() => {
    // player is running
})
.catch((error) => {
   // catches any error that might've happend while starting the player
})
```

## Promisified Methods

In *Version 1* **Node-MPV** just sent commands to the player but didn't check if they actually worked. This has change with *Version 2* but with this they way you should use the methods has changed as well.

You can still use all the methods the way you did in *Version 1*, you won't gain anything but you also won't lose anything, except that you might get some Uncaught Promise Exceptions.

### Version 1 Code

```JavaScript
mpv.load('your/favourite/song.mp3', 'replace');
```

This does not check if that file actually exists, could be loaded or if `replace` was actually a valid option.

### Version 2 Code
``` JavaScript
mpv.load('your/favourite/song.mp3', 'replace')
.then(() => {
    // song is running
})
.catch((error) => {
    // catches any errors
})
```

With this you can both be sure that the file is being played when you're executing your next function calls **and** any error is caught, for example if the file was not found or could not be played or even if `replace` was not a valid option.

## Chaining Promises

You can actually chain your calls easily like this but be sure to check the Async/Await version below as well.

```JavaScript
mpv.start()
.then(() => {
	return mpv.load('your/favourite/video.mkv');
})
.then(() => {
	// video is running
	return mpv.getDuration();
})
.then((duration) => {
	// outputs the video duration
	console.log(duration);
	return mpv.mute();
})
.then(() => {
	// video is muted
})
.catch((error) => {
	// any error from any of the calls above will be caught here
});
```

## Using Async/Await

Since **Node 8.0.0** Async/Await is fully supported. The code from above can be shortend a lot if run from within an *async* function.

```JavaScript
const someAsyncFunction = async () => {
	try{	
		await mpv.start();
		await mpv.load('your/favourite/video.mkv');
		// video is running
		console.log(await mpv.getDuration());
		await mpv.mute();
	}
	catch (error) {
		console.log(error);
	}
}
```