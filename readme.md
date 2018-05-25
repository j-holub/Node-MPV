# Node-MPV 2

A wrapper to comfortably use **[mpv player](https://github.com/mpv-player/mpv)** with **node**.js. It provides functions for most of the commands needed to control the player. It's easy to use and highly flexible.

The module keeps an instance of **mpv** running in the background (using mpv's `--idle`) and communicates over the Json IPC API.

It also provides direct access to the IPC socket. Thus this module is not only limited to the methods it provides, but can also fully communicate with the **mpv** API.

This module makes heavy use of [Promises](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Promise) to deal with the asynchronous nature of sending message over a socket and waiting for the reponse.

Works on **UNIX** and **Windows**.

**This module requires [mpv](https://github.com/mpv-player/mpv) to be installed on your system to work. On Windows you can provide the path to the mpv.exe using the `binary` option, when creating the mpv instance**

**For streaming playback from sources such as YouTube and SoundCloud [youtube-dl](https://github.com/rg3/youtube-dl) is required**


## Important

With Version **2.0.0** the API how to initialize and start **MPV** has changed. See the **Usage** and **Example** section to see, how it changed.

## Migration to Node-MPV 2

If you're already using **Node-MPV 1** please refer to this [Migration Guide](migrationguide.md) to see how to migrate your application to **Node-MPV 2**.


# Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Methods](#methods)
  * [Starting & Stopping](#starting--stopping)
  * [Load Content](#load-content)
  * [Controlling MPV](#controlling-mpv)
  * [Information](#information)
  * [Playlists](#playlists)
  * [Audio](#audio)
  * [Video](#video)
  * [Subtitles](#subtitles)
  * [Properties](#properties)
  * [Observing](#observing)
* [Events](#events)
* [Error Handling](#error-handling)
* [Example](#example)
* [Known Issues](#known-issues)
* [Changelog](CHANGELOG.md)


# Install


```
npm install node-mpv
```

#### OS X

```
brew install mpv youtube-dl
```

#### Linux (Ubuntu/Debian)

```
sudo apt-get install mpv youtube-dl
```

#### Windows

Go to the respective websites [mpv](https://mpv.io) and [youtube-dl](https://youtube-dl.org) and follow the install instructions.


**youtube-dl** is only required if you want to stream videos or music from *YouTube*, *SoundCloud* or other websites supported by **youtube-dl**. See [here](https://rg3.github.io/youtube-dl/supportedsites.html) for a list of supported websites.


# Usage

Every single method of **Node-MPV** returns a **Promise**, more on that later.

```Javascript
const mpvAPI = require('node-mpv');
const mpv = new mpvAPI();

// starts MPV
mpv.start()
.then(() => {
    // loads a file
    return mpv.load('your/favorite/song.mp3');
})
.then(() => {
    // file is playing
    // sets volume to 70%
    return mpv.volume(70);
})
// handle errors here
.catch((error) => {
    console.log(error);
});
```

You can optionally pass a JSON object with options to the constructor. Possible options, along with their default values are the following

```Javascript
{
    "audio_only": false,
    "auto_restart": true,
    "binary": null,
    "debug": false,
    "ipcCommand": null,   
    "socket": "/tmp/node-mpv.sock", // UNIX
    "socket": "\\\\.\\pipe\\mpvserver", // Windows
    "time_update": 1,
    "verbose": false,
}
```

* `audio_only` will add the `--no-video` and `--no-audio-display` argument and start **mpv** in audio only mode
* `auto_restart` - if set to true, **MPV** is restarted when it has crashed
* `binary` will use the provied path to a mpv binary instead of using the one found in **$PATH**
* `debug` prints error messages
* `ipc_command` sets the ipc command to start the ipc socket. Possible options are **--input-unix-socket** and **--input-ipc-server**. This is usually not needed since  **Node-MPV** is able to determine the correct command on its own
* `socket` specifies the socket **mpv** opens
* `time_update` the time interval in seconds, how often **mpv** should report the current time position, when playing a song or video
* `verbose` will print various information on the console

You can also provide an optional second argument, an Array containing **mpv** command line options. A list of available arguments can be found in the [documentation](https://mpv.io/manual/stable/#options)

```Javascript
const mpv = new mpvAPI({
  "verbose": true,
  "audio_only": true
},
[
  "--fullscreen",
  "--fps=60"
])

mpv.start()
.then(() => {
	// Code
});
```

**mpv** is then easily controllable via simple function calls.

```JavaScript
mpv.loadFile("/path/to/your/favorite/song.mp3");
```
```JavaScript
mpv.volume(70);
```

Events are used to detect changes.

```Javascript
mpv.on('statuschange', (status) => {
  console.log(status);
});

mpv.on('stopped', () => {
  console.log("Gimme more music");
});
```

## Promises

As stated above, *every single method* of **Node-MPV** returns a **Promise**. This means you will have to create a promise chain to control the player. The promise will be *resolved* if everything went fine and possibly returns some information and it will be *rejected* with a proper error message if something went wrong.

```JavaScript
mpv.start()
.then(() => {
    return mpv.load('/path/to/video.mkv');
})
.then(() => {
    return mpv.getDuration();
})
.then((duration) => {
    console.log(duration);
    return mpv.getProperty('someProperty');
})
.then((property) => {
    console.log(property);
})
// catches all possible errors from above
.catch((error) => {
    // Maybe the mpv player could not be started
    // Maybe the video file does not exist or couldn't be loaded
    // Maybe someProperty is not a valid property
    console.log(error);
}
```

## Async / Await

Starting from **Node 8.0.0** Async/Await is fully supported. If you're within an *async function* you can use *await* for better readability and code structure.

The promise code from above becomes this

```JavaScript
someAsyncFunction = asnyc () => {
    try{
    	await mpv.start();
    	await mpv.load('path/to/video.mkv');
    	console.log(await mpv.getDuration());
    	console.log(await mpv.getProperty('someProperty'));
    }
    catch (error) {
    	// Maybe the mpv player could not be started
    	// Maybe the video file does not exist or couldn't be loaded
    	// Maybe someProperty is not a valid property
    	console.log(error);
    }
}
```

# Methods

## Starting & Stopping

* **start** ()

  Starts the **MPV** process in the background. Has to be called before the player can be used.

  *return* - a promise that resolves when **MPV** is started and is rejected if an error occured

  ```JavaScript
  mpv.start()
  .then(() => {
      // The player can be used here
  });
  ```

* **quit** ()

  Quits **MPV**. The process in the backgroud is terminated and all socket connection is closed.

  **MPV** can be restarted using **start** ()

* **isRunning** () - *boolean*

  Returns whether **mpv** is running or not. This method is an exception, it **does not** return a Promise

## Load Content


  * **load** (content, mode="replace, options)

  Will load the `content` (either a **file** or a **url**) and start playing it. This behaviour can be changed using the `mode` option

  * `mode`
     * `replace`*(default)* replace current title and play it immediately
     * `append` appends the file to the playlist
     * `append-play` appends the file to the playlist. If the playlist is empty this file will be played
  * `options` *(optional)* an array that can be used to pass additional options to **mpv**

  There is another `append` function in the **playlist** section, which can be used to append either files or streams.

  *return* - a promise that resolves if everything went fine and the file or stream is playing  (or appened when *mode* was set to `append`) and is reject with an error message when something went wrong



## Controlling MPV

* **play** ()

  Starts playback when in the *pause* state

* **stop** ()

  Stops the playback entirely

* **pause** ()

  Pauses playback

* **resume** ()

  Resumes from the *pause* state

* **togglePause** ()

  Toggles the *pause* state

* **mute** ()

  Mutes the player

* **unmute** ()

  Unmutes the player

* **toggleMute** ()

  Toggles between *muted* and *unmuted*

* **volume** (volumeLevel)

  Sets volume to `volumeLevel`. Allowed values are between **0-100**. All values below or above will just set the volume to **0** or **100** respectively

* **adjustVolume** (value)

  Adjusts the volume with the specified `value`. If this results in the volume going below **0** or above **100** it will be set to **0** or **100** respectively

* **seek** (seconds)

  Will jump back or forth in the song or video for the specified amount of `seconds`. Going beyond the duration of a title results in the playback stopping

* **goToPosition** (seconds)

  Jumps to the position specified by `seconds`. Going beyond the boundaries of a title results in  playback stopping

* **loop** (times)

  Loops the current title `times` often. If set to *"inf"* the title is looped forever

## Information

 Because **node-mpv** communicates over a *Unix IPC Socket* with **mpv** it has to wait for the response, if it asks **mpv** for information. To make this more easily usable **Promises** are used. All the methods in this section return such a **Promise** and can be used like this

 ```JavaScript
 getSomeInfo()
 .then((info) => {
     console.log(info);
 });
 ```

 Or with **Async/Await**

 ```JavaScript
 const info = await getSomeInfo();
 console.log(info);
 ```

  * **isMuted** ()

    Tells if **mpv** is muted

  * **isPaused** ()

    Tells if **mpv** is paused

  * **isSeekable** ()

    Tells if the currently playing title is *seekable* or not. Streams that are not fully loaded might not be seekable. The same goes for *readiostreams* for example.

  * **getDuration** ()

    Returns the *duration* (*as a promise*) of the currently playing title if available. For example for *radiostreams* this will not be known.

  * **getTimePosition** ()

    Returns the current *timeposition* (*as a promise*) for the currently playing title

  * **getPercentPosition** ()

    Returns the current *timeposition* as a percantage value (*as a promise*) for the currently playing title

  * **getTimeRemaining** ()

    Returns the *remaining time* (*as a promise*) for the currently playing title, if possible

  * **getMetadata** ()

  	Returns the available *metadata* {*as a promise*) for the currently playing title. The promise returns a **JSON Object**

  	There are some helper function for quicker access to some *metadata*, they all return *promises* as usual.

  	* **getArtist** ()
  	* **getTitle** ()
  	* **getAlbum** ()
  	* **getYear** ()


  * **getFilename** (mode="full")

    Returns the *filename* (or *url*) of the currently playing track (as a *promise*).

	* `full` (default) the full path or url
	* `stripped` the path stripped to the file or the end of the url


## Playlists

  * **loadPlaylist** (playlist, mode="replace")

    Loads a playlist file. `mode` can be one of the two folllowing

    This function does not work with *YouTube* or *SoundCloud* playlists. Use **loadFile** or **loadStream** instead

      * `replace` *(default)* Replaces the old playist with the new one
      * `append`  Appends the new playlist to the active one

    *return* - a promise, that is resolved when everything went fine or rejected when an error occus. For example if the playlist file cannot be found or the first song in the playlist cannot be played

  * **append** (file, mode="append")

    Appends `file` (which can also be an url) to the playlist.

    * `mode`
      * `append` *(default)* Append the title
      * `append-play` When the playlist is empty the title will be started
    * `options` *(optional)* an array that can be used to pass additional options to **mpv**

    *return* - a promise that resolves if everything went fine and the file or stream is playing (when *mode* was set to `append-play`) or was appended (when *mode* was set to `append`) and is reject with an error message when something went wrong.

	**Note**

	It is **not** necessarily required to check the promise when using `append` (*default*). Checking whether the file can be played or not is done when it is played, not when it's appended.


  * **next** (mode="weak")

     Skips the current title. `mode` can be one of the following two

       * `weak` *(default*) If the current title is the last one in the playlist it is not skipped
       * `force` The title is skipped (even if it was the last one) and playback is stopped

    *return* - a promise that resolves to **true** when the track was skipped and **false** otherwise.
     The promise is rejected with an error message if the file is not playable.

  * **prev** (mode="weak")

     Skips the current title. `mode` can be one of the following two

       * `weak` *(default*) If the title is the first one in the playlist it is not stopped
       * `force` The title is skipped (even if it was the first one) and playback is stopped

    *return* - a promise that resolves to **true** when the track was skipped and **false** otherwise.
     The promise is rejected with an error message if the file is not playable.

  * **clearPlaylist** ()

     Clears the playlist

  * **playlistRemove** (index)

     Removes the title at `index` from the playlist. If `index` is set to "current" the current title is removed and playback stops

  * **playlistMove** (index1, index2)

     Moves the title at `index1` to the position at `index2`

  * **shuffle** ()

      Shuffles the playlist into a random order


  * **getPlaylistSize** ()

     Returns a *promise* that resolves to the playlist size

  *  **getPlaylistPosition** ()

     Returns a *promise* that resolves to the current playlist position. The position is **0-based**, which means, that positon 1 is 0 and so on.

  *  **getPlaylistPosition1** ()

     Just like `getPlaylistPosition()` but **1-based**, so the first position is 1 and so on.

## Audio

* **addAudioTrack** (file, flag, title, lang)

  Adds an audio file to the video that is loaded.
  * `file` The audio file to load
  * `flag` *(optional)* Can be one of "select" (default), "auto" or "cached"
  * `title` *(optional)* The name for the audio track in the UI  
  * `lang` *(optional)* the language of the audio track

  `flag` has the following effects

    * *select* - the added audio track is selected immediately
    * *auto* - the audio track is not selected
    * *cached* - select the audio track, but if an audio track file with the same name is already loaded, the new file is not added and the old one is selected instead

* **removeAudioTrack** ()

  Removes the audio track specified by `id`. Works only for external audio tracks

* **selectAudioTrack** (id)

  Selects the audio track associated with `id`

* **cycleAudioTracks** ()

  Cycles through the audio tracks

* **adjustAudioTiming** (seconds)

  Shifts the audio timing by `seconds`

* **speed** (scale)

  Controls the playback speed by `scale` which can take any value between **0.01** and **100**

  If the `--auto-pitch-correction` flag is used (default), this will not pitch the audio and uses a scaletempo audio filter


## Video

* **fullscreen** ()

  Goes into fullscreen mode

* **leaveFullscreen** ()

  Leaves fullscreen mode

* **toggleFullscreen** ()

  Toggles between fullscreen and windowed mode

* **screenshot** (file, option)

  Takes a screenshot and saves it to `file`. `options` is one of the following
  * `subtitles` *(default)* Takes a screenshot including the subtitles
  * `video` Only the image, no subtitles
  * `window` The scaled mpv window

* **rotateVideo** (degrees)

  Rotates the video clockwise. `degree` can only be multiples of 90 and the rotation is absolute, not relative

* **zoomVideo** (factor)

  Zooms into the video. **0** does not zoom at all, **1** zooms double and so on

* **brightness** (value)

  Sets the brightness to `value`. Allowed values are between **-100** and **100**

* **contrast** (value)

  Sets the contrast to `value`. Allowed values are between **-100** and **100**

* **saturation** (value)

  Sets the saturation to `value`. Allowed values are between **-100** and **100**

* **gamma** (value)

  Sets the gamma to `value`. Allowed values are between **-100** and **100**

* **hue** (value)

  Sets the hue to `value`. Allowed values are between **-100** and **100**



## Subtitles

* **addSubtilte** (file, flag, title, lang)

  Adds a subtitle file to the video that is loaded.
  * `file` The subtitle file to load
  * `flag` *(optional)* Can be one of "select" (default), "auto" or "cached"
  * `title` *(optional)* The name for the subtitle file in the UI  
  * `lang` *(optional)* The language of the subtitle

  `flag` has the following effects

    * *select* - the added subtitle is selected immediately
    * *auto* - the subtitle is not selected
    * *cached* - select the subtitle, but if a subtitle file with the same name is already loaded, the new file is not added and the old one is selected instead

* **removeSubitlte** (id)

  Removes the subtitle file specified by `id`. Works only for external subtitles

* **selectSubitlte** (id)

  Selects the subtitle associated with `id`

* **cycleSubtitles** ()

  Cycles through all available subtitles

* **toggleSubtitleVisibility** ()

  Toggles between hidden and visible subtitles

* **showSubtitles** ()

  Shows the subtitles

* **hideSubtitles** ()

  Hides the subtitles

* **adjustSubtitleTiming** (seconds)

  Shifts the subtitle timing by `seconds`

* **subtitleSeek** (lines)

  Jumps as many lines of subtitles as defined by `lines`. Can be negative. This will also seek in the video.

* **subitlteScale** (scale)

  Adjust the scale of the subtitles



## Properties

These methods can be used to alter *properties* or send arbitary *commands* to the running **mpv player**. Information about what *commands* and *properties* are available can be found in the [list of commands](https://mpv.io/manual/stable/#list-of-input-commands) and [list of properties](https://mpv.io/manual/stable/#properties) sections of the **mpv** documentation.

The most common commands are already covered by this modules **API**. This part enables you to send any command you want over IPC. With this you are not limited the methods defined by this module.

* **setProperty** (property, value)

  Sets the specified `property` to the specified `value`

* **setMultipleProperties** (properties)

  Calls **setProperty** for every property specified in the arguments Json object. For example

  ```Javascript
  setMultipleProperties({
      "volume": 70,
      "fullscreen": true
  });
  ```

* **getProperty** (property)

  Gets information about the specified `property`.

  *return* - a promise that resolves to the property value

* **addProperty** (property, value)

  Increase the `property` by the specified `value`. Needless to say this can only be used on numerical properties. Negative values are possible

* **multiplyProperty** (property, value)

  Multiply the specified `property` by `value`

* **cycleProperty** (property)

  Cycles the values of an arbitrary property

* **command** (command, args)

  Sends the `command` to the **mpv** player with the arguments specified in `args`
  The Json command

  ```Javascript
  {"command": ["loadfile", "audioSong.mp3"]}
  ```

  becomes a function call

  ```Javascript
  command("loadfile",["audioSong.mp3"]
  ```

* **freeCommand** (command)

  This will send an arbitrary *command* to the **mpv player**. It must follow the specification of the **Json IPC protocol**. Its syntax can be found in the [documentation](https://mpv.io/manual/stable/#json-ipc).

  A trailing "**\n**" will be added to the command.

## Observing

  **node-mpv** allows you to observe any property the [mpv API](https://mpv.io/manual/stable/#property-list) offers you, by simply using the **observeProperty** function.  

 * **observeProperty** (property, id)

   This will add the specified *property* to the *statusupdate* event which is emitted whenever one of the observed properties changes.

   The **Id**s **0**-**12** are already taken by the properties which are observed by default.

* **unobserveProperty(id)**

  This will remove the property associated with the specified *id* from the *statusupdate*.

  Unobserving default properties may break the module.

# Events

The **Node-MPV** module provides various *events* to notify about changes of the **mpv player's** state.

* **crashed**

  Whenever **mpv** has crashed or the process was killed. If the `auto_restart` option is set to **true** (*default*), **mpv** is restarted again right away.

  Use this event to for example reload your playlist, videos, etc when the player crashed

* **getrequest** \<id, data\> - *deprecated*

  Delivers the reply to a function call to the *getRequest* method

* **seek** <timeposition object>

  Whenever a `seek()` or `goToPosition()` is called, or some external source searches, this event is emitted providing a **timeposition** object with the following information

  ```
  {
      start: <timeposition before seeking>,
      end:   <timeposition after  seeking>
  }
  ```

  In case the seek can not be finished, for example because the file is changed while seeking, this event is not emitted. It is only emitted when the seeking has successfully finished.

* **started**

  Whenever **mpv** starts playing a song or video

* **stopped**

  Whenever the playback has stopped

* **paused**

  Whenever **mpv** was paused

* **resumed**

  Whenever **mpv** was resumed


* **statuschange** \<status object\>

  Whenever the status of one of the observed properties changes, this event will be emitted providing the complete *status object*

  By default various properties are already observed and the *status object* looks like the following

  ```Javascript
  {
    "mute": false,
    "pause": false,
    "duration": null,
    "volume": 100,
    "filename": null,
    "path": null,
    "media-title": null,
    "playlist-pos": 0,
    "playlist-count": 0,
    "loop": "no"
  }
  ```

    If the player is running in *video mode* the following properties are present as well.

  ```Javascript
  {
    "fullscreen": false,
    "sub-visibility": false
  }
  ```

* **timeposition** \<seconds\>

  When a song or video is currently playing and the playback is not paused, this event will emit the current position in *seconds*.

  When creating the **mpv** instance you can set a parameter, how often this event should occur. Default is every second

* **quit**

   When mpv player was quit by the user on purpose, this event is emitted. It is **not** emitted, when the `quit()` method was used.

   Use this to detect if the user has closed the player.

### Note

  * `filename`
    When playing a local file this contains the filename. When playing for example a *YouTube* stream, this will only contain the trailing url

  * `path`
    Provides the absolute path to the file or the full url of a stream

  * `media-title` If available in the file this will contain the *title*. When streaming from *YouTube* this will be set to the video's name

    This object can expanded through the *observeProperty* method making it possible to watch any state you desire, given it is provided by **mpv**

# Error Handling

If a method's **promise** is *rejected* it returns an error object. This object looks like the following

``` JavaScript
{
    'errcode': Error Code
    'verbose': Verbal version of the Error Code
    'method': Method that raised the error
    'arguments': List of arguments the method was called with
    'errmessage': More specific error message
    'options': JSON object with valid options for the method if possible
}
```

The following **Error Codes** are available

* **0** Unable to load file or stream
* **1** Invalid argument
* **2** Binary not found
* **3** ipcCommand invalid
* **4** Unable to bind IPC socket
* **5** Timeout
* **6** MPV is already running
* **7** Could not send IPC message

# Example

```Javascript
const mpvAPI = require('node-mpv');
const mpv = new mpvAPI();

// Start the player
mpv.start()
.then(() => {
	// This will load and start the song
	return mpv.load('/path/to/your/favorite/song.mp3')
})
.then(() => {
	// Set the volume to 50%
	return mpv.volume(50);
})
.then(() => {
	// Stop to song emitting the stopped event
	return mpv.stop();
})
// this catches every arror from above
.catch((error) => {
	console.log(error);
});

// This will bind this function to the stopped event
mpv.on('stopped', () => {
    console.log("Your favorite song just finished, let's start it again!");
    mpv.loadFile('/path/to/your/favorite/song.mp3');
});

```

# Known Issues

## Old MPV Version on Debian

Debian took their stable policy a little to far and **MPV** is still on version **0.6.0**. Unfortunately the **IPC functionality** was only introduced with version **0.7.0**. Thus this module will just **not work** with the debian packaged **MPV**.

The dependecies to build **MPV** are also too old on Debian (but I guess they are stable, right?). Lucky there is [this](https://github.com/mpv-player/mpv-build) project, that helps you to build the dependencies and mpv afterwards.

Using this you can easily get the latest stable **MPV Player** on Debian.

## IPC Command

The command line argument to start the IPC socket has changed in mpv version **0.17.0** from `--input-unix-socket` to `--input-ipc-socket`. This module uses regular expressions to find the version number from the `mpv --version` output. If mpv is compiled from source, the version number is stated as **UNKNOWN** and this module will assume, that you use the latest version and use the new command.

**If you use self compiled version stating UNKNOWN as the version number below mpv version 0.17.0 you have to use the ipc_command option with '--input-unix-socket'.**

To check this enter the following in your command shell

```
mpv --version
```

## Bug with observing playlist-count in MPV Player 0.17.0

In **mpv** version **0.17.0**, the `playlist-count` property is not updated on **playlistRemove** and **append**.

I filed an Issue and this is fixed with **0.17.1**

## MPV Player 0.18.1

MPV Player version **0.18.1** has some issues that the player crashes sometimes, when sending commands through the *ipc socket*. If you're using version **0.18.1** try to use a newer (or older) version.

To check your version number enter the following in your command shell

```
mpv --version
```

## MPV Hanging or Crashing

If your JS code is correct but you are still experiencing crashes, a good place to start debugging is by disabling the default config and/or plugins.

```Javascript
mpvPlayer = new mpv({
  ...
},
[
  "--no-config",
  "--load-scripts=no"
]);
```

For example, `autoload.lua` is known to cause problems when loading files in quick succession from a folder with many files.

# Changelog

See [changelog](CHANGELOG.md) for more information or API breaking changes
