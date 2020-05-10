# Migration Guide for Version 2

If you've been using *Version 1* of **Node-MPV** here's how you can migrate your app to *Version 2*. A lot has changed and there is quite a lot of changes you will have to make to your code, but it really works so much better.

- [Migration Guide for Version 2](#migration-guide-for-version-2)
	- [Starting MPV](#starting-mpv)
	- [Promisified Methods](#promisified-methods)
		- [Using Async/Await](#using-asyncawait)
		- [Chaining Promises](#chaining-promises)
	- [Statuschange event](#statuschange-event)
	- [Observing properties](#observing-properties)
	- [Changed Methods](#changed-methods)
			- [mute](#mute)
		- [loop](#loop)
		- [loopPaylist & clearLoopPlaylist](#looppaylist--clearloopplaylist)
	- [Error Handling with the new Error Object](#error-handling-with-the-new-error-object)
	

## Starting MPV

In *Version 1* you didn't need to explicitly have to start the player, in *Version 2* you do.


``` JavaScript
// Version 1 Code
const mpvAPI = require('node-mpv');
const mpv = new mpvAPI();

// player is running
```
This didn't check at all if everything worked out, like binding the IPC socket or if the provided mpv binary actually existed.


``` JavaScript
// Version 2 Code 
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



```JavaScript
// Version 1 Code
mpv.load('your/favourite/song.mp3', 'replace');
```

This does not check if that file actually exists, could be loaded or if `replace` was actually a valid option.


From within an **async** function, Use the `then()` and `catch()` synthax if not

``` JavaScript 
// Version 2 Code
try{
	await mpv.load('your/favourite/song.mp3', 'replace')
}
catch(error) {
	// catches any errors
});
```

With this you can both be sure that the file is being played when you're executing your next function calls **and** any error is caught, for example if the file was not found or could not be played or even if `replace` was not a valid option.

### Using Async/Await

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


### Chaining Promises

If (for some reason) you don't want to or cannot use **async / await** you can chain promises like seen in the following code

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




## Statuschange event

The `statuschange` event has been renamed to `status` and fires individually for every observed propertey. The object looks like the following

```JSON
{
	'property': <name of the property>,
	'value': <value of the property>
}
```



## Observing properties

In version one you had to manage some ids if you wanted to *observe* and later *unobserve* some properties. Luckly, with **Node-MPV 2** this handled internally. All you have to do, is name which *property* you want to have observed.


```JavaScript
// Version 1 Code
mpv.observeProperty('display-fps', 15);
mpv.unobserveProperty(15);
```

```JavaScript
// Version 2 Code
await mpv.observeProperty('display-fps');
await mpv.unobserveProperty('display-fps');
```

## Changed Methods

Some methods were changed in the way they are used or called

#### mute

The methods `mute()`, `unmute()` and `toggleMute()` are now one single method called `mute()`  that can take an argument. The code below shows the Version 1 style together with the Version 2 counterparts

```JavaScript
// Version 1 Code
mpv.mute();
mpv.unmute();
mpv.toggleMute();
// Version 2 Code
await mpv.mute(true);
await mpv.mute(false);
await mpv.mute();
```

### loop

Loop can be used exactly how it was used in Version 1 without causing any problems. However, the method can also be used without passing a parameter now, which will toggle the mute state between *on* and *off*

### loopPaylist & clearLoopPlaylist

The two methods `loopPlaylist()` and `clearLoopPlaylist()` are now one method `loopPlaylist`, which works exactly as the new `loop()` method, described in the paragraph before.


## Error Handling with the new Error Object

With Version 2, I introduced an error object, to help you out if something didn't work. You can read more about it [here](./readme.md#error-handling) (Just click on the `Error Handling` section in the table of contents). Make sure to make use of it, as it is pretty helpful.