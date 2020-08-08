# Node-MPV 2

A wrapper, that allows you, to comfortably use **[mpv player](https://github.com/mpv-player/mpv)** with **NodeJs**. It offers an API for the most relevant functionalities and is highly flexible. The module keeps an instance of **MPV** running in the background (using MVP's `--idle`) and communicates over **MPV's** JSON IPC (Inter-Process Communication) API.

However, it doesn't stop there, it also provides direct access to the IPC socket itself. Thus this module is not limited to the methods it provides, but can used with the full extent of what **MPV** has to offer, even if some command is not supported by **Node-MPV**.

Works on **UNIX** and **Windows**.

This module requires **[mpv](https://github.com/mpv-player/mpv)** to be installed on your system to work. For streaming playback from sources such as *YouTube* and *SoundCloud* **[youtube-dl](https://github.com/rg3/youtube-dl)** is required.


## Node-MPV 1

If you are looking for source code of the original Version 1 of this package, you can find it [here](https://github.com/j-holub/Node-MPV/tree/Node-MPV-1). Furthermore, you can install the latest **1.x.x** version using

```
npm install node-mpv@"^1.x.x"
```

This will install and update to the latest **1.x.x** version, but never to anything >= **2.x.x**. With this, you will automatically get bug fixes for version 1, without having to worry about any API breaking changes. Keep in mind, that I most likely won't add any new features to Version 1, but only provide bug fixes. Also, you should consider switching to Version 2, there even is a handy [migration guide](migrationguide.md).

## Migration to Node-MPV 2

If you're already using **Node-MPV 1** please refer to this [Migration Guide](migrationguide.md) to see how to migrate your application to **Node-MPV 2**.


# Table of Contents

- [Node-MPV 2](#node-mpv-2)
  - [Node-MPV 1](#node-mpv-1)
  - [Migration to Node-MPV 2](#migration-to-node-mpv-2)
- [Table of Contents](#table-of-contents)
- [Install](#install)
  - [Dependencies](#dependencies)
      - [macOS](#macos)
      - [Linux (Ubuntu/Debian)](#linux-ubuntudebian)
      - [Windows](#windows)
- [Usage](#usage)
  - [Promises](#promises)
  - [Hooking into a Running Instance of MPV](#hooking-into-a-running-instance-of-mpv)
- [API](#api)
  - [Starting & Stopping](#starting--stopping)
  - [Load Content](#load-content)
  - [Controlling MPV](#controlling-mpv)
  - [Information](#information)
  - [Playlists](#playlists)
  - [Audio](#audio)
  - [Video](#video)
  - [Subtitles](#subtitles)
  - [Properties](#properties)
  - [Observing](#observing)
- [Events](#events)
    - [Note](#note)
- [Error Handling](#error-handling)
- [Example](#example)
- [Known Issues](#known-issues)
  - [Old MPV Version on Debian](#old-mpv-version-on-debian)
  - [IPC Command](#ipc-command)
  - [Bug with observing playlist-count in MPV Player 0.17.0](#bug-with-observing-playlist-count-in-mpv-player-0170)
  - [MPV Player 0.18.1](#mpv-player-0181)
  - [MPV Hanging or Crashing](#mpv-hanging-or-crashing)
- [Changelog](#changelog)


# Install

As of now, Version 2 is still in beta, but has been used by many people over the last 2 years. It's very very close to a stable version.

```
npm install node-mpv@beta
```

## Dependencies

At least **[mpv](https://github.com/mpv-player/mpv)** is required, but **[youtube-dl](https://github.com/rg3/youtube-dl)** is recommended as well. **youtube-dl** is only required if you want to stream videos or music from *YouTube*, *SoundCloud* or other websites supported by **youtube-dl**. See [here](https://rg3.github.io/youtube-dl/supportedsites.html) for a list of supported websites.

#### macOS

```
brew install mpv youtube-dl
```

#### Linux (Ubuntu/Debian)

```
sudo apt-get install mpv youtube-dl
```

#### Windows

Go to the respective websites [mpv](https://mpv.io) and [youtube-dl](https://youtube-dl.org) and follow the install instructions.



# Usage

Every single method of **Node-MPV** returns a **Promise**, more on that later. The following example assumes, that it is put within an **async** function. For an example using the old `.then()` way, look a little further below

```Javascript
// where you import your packages
const mpvAPI = require('node-mpv');
// where you want to initialise the API
const mpv = new mpvAPI();

// somewhere within an async context
// starts MPV
try{
  await mpv.start()
  // loads a file
  await mpv.load('your/favorite/song.mp3');
  // file is playing
  // sets volume to 70%
  await mpv.volume(70);
}
catch (error) {
  // handle errors here
  console.log(error);
}
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
* `binary` will use the provided path to a mpv binary instead of using the one found in **$PATH**
* `debug` prints error messages
* `ipc_command` sets the ipc command to start the ipc socket. Possible options are **--input-unix-socket** and **--input-ipc-server**. This is usually not needed since  **Node-MPV** is able to determine the correct command on its own
* `socket` specifies the socket **mpv** opens. **Node-MPV** will first check, if there's already an **mpv** instance running on that socket and hook into it
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

await mpv.start()
// Code controlling mpv
```

**mpv** is then easily controllable via simple function calls.

```JavaScript
await mpv.loadFile("/path/to/your/favorite/song.mp3");
```
```JavaScript
await mpv.volume(70);
```

Events are used to detect changes.

```Javascript
mpv.on('status', (status) => {
  console.log(status);
});

mpv.on('stopped', () => {
  console.log("Gimme more music");
});
```


## Promises

If, for some reason, you don't want to use the `async/await` syntax, you can use Promises the old fashioned way. *Every single method* of **Node-MPV** returns a **Promise**. This means you will have to create a promise chain to control the player. The promise will be *resolved* if everything went fine and possibly returns some information and it will be *rejected* with a proper error message if something went wrong.

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

Starting from **Node 8.0.0** Async/Await is fully supported. If you're within an *async function* you can use *await* for better readability and code structure. The promise code from above becomes this

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

## Hooking into a Running Instance of MPV

Using the options you can specify the *IPC socket*, that should be created to handle the communication between **MPV** and this module. If there is already an instance of **MPV** running, that has been started with `--idle` and `--input-ipc-server=</tmp/somesocket.sock>`, you can hook into that instance by specifying `socket=</tmp/somesocket.sock>`. In this case, **Node-MPV** will *not* create its own instance of **MPV** but use the already running one.

However, it is not possible to enable `auto_restart` or any error handling for an external **MPV** instance. That has to be handled by that instance itself.

Since it is not possible to determine if an **MPV** instance, that has been started externally, has crashed or was properly quit, both events `crashed` and `quit` will be emitted if hooking into an existing instance. See the [Events](#events) section for more.

# API

## Starting & Stopping

* **start** (mpv_args=[])

  Starts the **MPV** process in the background. Has to be called before the player can be used.

  * `mpv_args`
  List of arguments for the MPV player, the same as when calling the constructor. Possible arguments can be found in the   [documentation](https://mpv.io/manual/stable/#options).

  *return* - a promise that resolves when **MPV** is started and is rejected if an error occurs

  ```JavaScript
  mpv.start()
  .then(() => {
   // The player can be used here
  });
  ```

* **quit** ()

  Quits **MPV**. The process in the background is terminated and all socket connection is closed. **MPV** can be restarted using **start** ()

* **isRunning** () - *boolean*

  Returns whether **MPV** is running or not. This method is an exception, it **does not** return a Promise

## Load Content


 * **load** (content, mode="replace", options)

    Will load the `content` (either a **file** or a **url**) and start playing it. This behaviour can be changed using the `mode`  option

    * `mode`
    * `replace`*(default)* replace the current title and play it immediately
    * `append` appends the file to the playlist
    * `append-play` appends the file to the playlist. If the playlist is empty this file will be played
    * `options` *(optional)* an array that can be used to pass additional options to **MPV**

    There is another `append` function in the **playlist** section, which can be used to append either files or streams.
  
    *return* - a promise that resolves if everything went fine and the file or stream is playing (or appended when *mode* was   set  to `append`) and is rejected with an error message when something went wrong



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

* **mute** (set)

  Mutes or unmutes the player. The mute state can either be toggled or set explicitly

   * `set` (optional) If not set, the mute state is toggled. If set to true the player is muted, if set to false the player is unmuted, regardless of the current state

* **volume** (volumeLevel)

  Sets volume to `volumeLevel`. Allowed values are between **0-100**. All values below or above will just set the volume to **0** or **100** respectively

* **adjustVolume** (value)

  Adjusts the volume with the specified `value`. If this results in the volume going below **0** or above **100** it will be set to **0** or **100** respectively

* **seek** (seconds, mode="relative")

  Will search/jump within the current track. Depending on `mode`, it is searched onwards from the current position, or jumped to the set position, given by `seconds`

   * `mode`
   * `relative` (default) Searches x seconds from the current track position
   * `absolute` Jumps to the position at x seconds in the current track

  *return* - a promise that is resolved once the track is being played again or rejected if something went wrong

* **goToPosition** (seconds)

  Jumps to the position specified by `seconds`. Going beyond the boundaries of a title results in playback stopping

* **loop** (times)

   * `times` (optional) can be any *number > 0*, `inf` or `no`. Will loop of a fixed number of times (number), infinitely (`inf`) or will stop looping (`no`)
 
  If `times` is **not set**, this will *toggle* the mute status between not looping and infinitely looping. If `times` is set, it will loop the track as often as the passed value.


## Information

* **isMuted** ()

  Tells if **MPV** is muted

* **isPaused** ()

  Tells if **MPV** is paused

* **isSeekable** ()

  Tells if the currently playing title is *seekable* or not. Streams that are not fully loaded might not be seekable. The same goes for *radio streams* for example.

* **getDuration** ()

  Returns the *duration* (*as a promise*) of the currently playing title if available. For example for *radio streams* this will not be known.

* **getTimePosition** ()

  Returns the current *timeposition* (*as a promise*) for the currently playing title

* **getPercentPosition** ()

  Returns the current *timeposition* as a percentage value (*as a promise*) for the currently playing title

* **getTimeRemaining** ()

  Returns the *remaining time* (*as a promise*) for the currently playing title, if possible

* **getMetadata** ()

  Returns the available *metadata* {*as a promise*) for the currently playing title. The promise returns a **JSON Object**

  There are some helper functions for quick access to some *metadata*, they all return *promises* as usual.

* **getArtist** ()
* **getTitle** ()
* **getAlbum** ()
* **getYear** ()


* **getFilename** (mode="full")

  * `full` (default) the full path or url
  * `stripped` the path stripped to the file or the end of the url

  Returns the *filename* (or *url*) of the currently playing track (as a *promise*).

## Playlists

* **loadPlaylist** (playlist, mode="replace")

  Loads a playlist file. `mode` can be one of the two following

   * `replace` *(default)* Replaces the old playlist with the new one
   * `append` Appends the new playlist to the active one

  This function does not work with *YouTube* or *SoundCloud* playlists. Use **loadFile** or **loadStream** instead

  *return* - a promise, that is resolved when everything went fine or rejected when an error occurs. For example, if the playlist file cannot be found or the first song in the playlist cannot be played

* **append** (file, mode="append")

  Appends `file` (which can also be an url) to the playlist.

   * `mode`
   * `append` *(default)* Append the title
   * `append-play` When the playlist is empty the title will be started
   * `options` *(optional)* an array that can be used to pass additional options to **mpv**

  *return* - a promise that resolves if everything went fine and the file or stream is playing (when *mode* was set to `append-play`) or was appended (when *mode* was set to `append`) and is rejected with an error message when something went wrong.

  It is **not** necessarily required to check the promise when using `append` (*default*). Checking whether the file can be played or not is done when it is played, not when it's appended.


* **next** (mode="weak")

   Skips the current title. `mode` can be one of the following two

   * `weak` *(default*) If the current title is the last one in the playlist it is not skipped
   * `force` The title is skipped (even if it was the last one) and playback is stopped

  *return* - a promise that resolves to **true** when the track was skipped and **false** otherwise.
  Throws an error message if the file is not playable.

* **prev** (mode="weak")

  Skips the current title. `mode` can be one of the following two

   * `weak` *(default*) If the title is the first one in the playlist it is not stopped
   * `force` The title is skipped (even if it was the first one) and playback is stopped

  *return* - a promise that resolves to **true** when the track was skipped and **false** otherwise.
  Throws an error message if the file is not playable.

* **jump** (position)

  Jumps to the position in the playlist given by `position`. It's zero-based, meaning that the first spot in the playlist is **0**.

  *return* - a promise that resolves to **true** when the player jumped in the playlist and **false** if the desired position is not possible because it is not within the playlist size.

  Throws an error message if the file is not playable.

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

* **getPlaylistPosition** ()

  Returns a *promise* that resolves to the current playlist position. The position is **0-based**, which means, that positon 1 is 0 and so on.

* **getPlaylistPosition1** ()

  Just like `getPlaylistPosition()` but **1-based**, so the first position is 1 and so on.

* **loopPlaylist** (times)

   * `times` (optional) can be any *number > 0*, `inf` or `no`. Will loop of a fixed number of times (number), infinitely (`inf`) or will stop looping (`no`)
 
  If `times` **is not** set, this will *toggle* the mute status between not looping and infinitely looping the playlist. If `times` **is** set, it will loop the playlist as often as the passed value.

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

  If the `--auto-pitch-correction` flag is used (default), this will not pitch the audio and uses a scale tempo audio filter


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
   * `window` The scaled MPV window

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

* **addSubtitles** (file, flag, title, lang)

  Adds a subtitle file to the video that is loaded.
   * `file` The subtitle file to load
   * `flag` *(optional)* Can be one of "select" (default), "auto" or "cached"
   * `title` *(optional)* The name for the subtitle file in the UI 
   * `lang` *(optional)* The language of the subtitle

  `flag` has the following effects

   * *select* - the added subtitle is selected immediately
   * *auto* - the subtitle is not selected
   * *cached* - select the subtitle, but if a subtitle file with the same name is already loaded, the new file is not added and the old one is selected instead

* **removeSubtitles** (id)

  Removes the subtitle file specified by `id`. Works only for external subtitles

* **selectSubtitles** (id)

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

* **subtitleScale** (scale)

  Adjust the scale of the subtitles

* **displayASS** (assMessage, duration, position=7)

  Displays **ass-formated** subtitles. A good documentation about **ass** can be found [here](http://docs.aegisub.org/3.2/ASS_Tags/).

  * `assMessage` the subitle text along with the **ass-tags**
  * `duration` the time the subtitle should be displayed in *miliseconds*
  * `position` where the subtitles are displayed. It works like a numpad (**5** being center and so on). The default is **7** - the top left corner

  This method will add `${osd-ass-cc/0}` (along with the position tag) in front of your message, to enable **ass** formating and *parameter expansion*.

  You cannot show two different subtitles at the same time, the newer one will overwrite the previous one. This is a limitation of **mpv**.

  Unfortunately beforehand defined **ass styles** do not work, you have to style your subtitles using **ass-tags**

  ```JavaScript
  player.displayASS('{\\fsp10}Hey I'm a letter spaced subtitle in the center of the screen', 5000, 5);
  ```


## Properties

These methods can be used to alter *properties* or send arbitrary *commands* to the running **MPV player**. Information about what *commands* and *properties* are available can be found in the [list of commands](https://mpv.io/manual/stable/#list-of-input-commands) and [list of properties](https://mpv.io/manual/stable/#properties) sections of the **MPV** documentation.

The most common commands are already covered by this module. However, this part enables you to send any command you want over the IPC socket. Using this, you aren't limited to the methods defined by this module.

* **setProperty** (property, value)

  Sets the specified `property` to the specified `value`

* **setMultipleProperties** (properties)

  Calls **setProperty** for every property specified in the arguments JSON object. For example

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

  Increase the `property` by the specified `value`. Needless to say, this can only be used on numerical properties. Negative values are possible

* **multiplyProperty** (property, value)

  Multiply the specified `property` by `value`

* **cycleProperty** (property)

  Cycles the values of an arbitrary property

* **command** (command, args)

  Sends the `command` to the **MPV** player with the arguments specified in `args`
  The JSON command

  ```Javascript
  {"command": ["loadfile", "audioSong.mp3"]}
  ```

  becomes a function call

  ```Javascript
  command("loadfile",["audioSong.mp3"]
  ```

* **commandJSON** (command)

   Sends a command, specified by a JSON object to mpv. Please refer to the [documentation](https://mpv.io/manual/stable/#json-ipc) for the protocol.

   ```JavaScript
   let command = {
       'command': [
           'loadfile',
           'audioSong.mp3'      
       ]
   };
   mpvPlayer.commandJSON(command);
   ```

* **freeCommand** (command)

  This will send an arbitrary *command* to the **MPV player**. It must follow the specification of the **Json IPC protocol**. Its syntax can be found in the [documentation](https://mpv.io/manual/stable/#json-ipc).

  A trailing "**\n**" will be added to the command.



## Observing

**Node-MPV** allows you to observe any property the [mpv API](https://mpv.io/manual/stable/#property-list) offers you, by simply using the **observeProperty** function. 

* **observeProperty** (property)

  This will observe `property`, which means, that a **status** event is emitted, whenever this property changes

* **unobserveProperty** (property)

  No further **status** event will be emitted for `property`

# Events

  The **Node-MPV** module provides various *events* to notify about changes of the **MPV player's** state.

* **crashed**

  Whenever **MPV** has crashed or the process was killed. If the `auto_restart` option is set to **true** (*default*), **MPV** is restarted again right away.

  Use this event to for example reload your playlist, videos, etc when the player crashed

* **getrequest** \<id, data\> - *deprecated*

  Delivers the reply to a function call to the *getRequest* method

* **seek** <timeposition object>

  Whenever a `seek()` or `goToPosition()` is called, or some external source searches, this event is emitted providing a **timeposition** object with the following information

  ```JavaScript
  {
  "start": <timeposition before seeking>,
  "end": <timeposition after seeking>
  }
  ```

  In case the seek can not be finished, for example, because the file is changed while seeking, this event is not emitted. It is only emitted when the seeking has successfully finished.

* **started**

  Whenever **MPV** starts playing a song or video

* **stopped**

  Whenever the playback has stopped

* **paused**

  Whenever **MPV** was paused

* **resumed**

  Whenever **MPV** was resumed


* **status** \<status object\>

  Whenever the status of one of the observed properties changes, this event will be emitted providing the change to that property in the form of

  ```JavaScript
  {
    "property": <propertyname>,
    "value": <propertyvalue>
  }
  ```

  By default, the following properties are observed
 
   * **mute**
   * **pause**
   * **duration**
   * **volume**
   * **filename**
   * **path**
   * **media-title**
   * **playlist-pos**
   * **playlist-count**
   * **loop**

  If the player is running in *video mode* the following properties are present as well.

    * **fullscreen**
    * **sub-visibility**
 

* **timeposition** \<seconds\>

  When a song or video is currently playing and the playback is not paused, this event will emit the current position in *seconds*.

  When creating the **MPV** instance you can set a parameter, how often this event should occur. Default is every second

* **quit**

  When MPV player was quit by the user on purpose, this event is emitted. It is **not** emitted, when the `quit()` method was used.

  Use this to detect if the user has closed the player.



### Note

  * `filename`
    When playing a local file this contains the filename. When playing for example a *YouTube* stream, this will only contain the trailing url

  * `path`
    Provides the absolute path to the file or the full url of a stream

  * `media-title` If available in the file this will contain the *title*. When streaming from *YouTube* this will be set to the video's name

    This object can expanded through the *observeProperty* method making it possible to watch any state you desire, given it is provided by **mpv**

# Error Handling

Because the *JSON IPC API* of **MPV** does not provide any useful error messages, except for *it worked* or *it didn't work*, I created an error object, that should help you to figure out what went wrong, and hint you into the right direction for fixing the issue.

If there is an error with a method of this library, it will throw an exception (reject the promise) with an error object, that looks like the following.

``` JavaScript
{
    'errcode': Error Code
    'verbose': Verbal version of the Error Code
    'method': Method that raised the error
    'arguments': List of arguments the method was called with
    'errmessage': More specific error message
    'options': JSON object with valid options for the method if possible
    'stackTrace': The error stack trace
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
* **8** MPV is not running

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

Debian took their stable policy a little to far and **MPV** is still on version **0.6.0**. Unfortunately the **IPC functionality** was only introduced with version **0.7.0**. Thus this module will **not work** with the Debian packaged **MPV**. The dependencies to build **MPV** are also too old on Debian. Luckily there is [this](https://github.com/mpv-player/mpv-build) project, that helps you to build the dependencies and MPV afterwards. Using this you can easily get the latest stable **MPV Player** on Debian.

## IPC Command

The command-line argument to start the IPC socket has changed in MPV version **0.17.0** from `--input-unix-socket` to `--input-ipc-server`. This module uses regular expressions to find the version number from the `mpv --version` output. If MPV was compiled from source, the version number is stated as **UNKNOWN** and this module will assume, that you use the latest version and use the new command.

**If you use self compiled version stating UNKNOWN as the version number below mpv version 0.17.0 you have to use the ipc_command option with '--input-unix-socket'.**

To check this enter the following in your command shell

```
mpv --version
```

## Bug with observing playlist-count in MPV Player 0.17.0

In **mpv** version **0.17.0**, the `playlist-count` property is not updated on **playlistRemove** and **append**.

I filed an Issue and this is fixed with **0.17.1**

## MPV Player 0.18.1

MPV Player version **0.18.1** has some issues that the player crashes sometimes when sending commands through the *ipc socket*. If you're using version **0.18.1** try to use a newer (or older) version.

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

