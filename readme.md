# Node-MPV

This is an NPM Module to control **[mpv player](https://github.com/mpv-player/mpv)** through the Json IPC API.

It keeps MPV running in the background with the `--idle` argument all the time and provides an easy-to-use interface, to control the player.


**This module requires [mpv](https://github.com/mpv-player/mpv) to be installed on your system to work**

**For streaming playback such as YouTube and SoundCloud [youtube-dl](https://github.com/rg3/youtube-dl) is required**



## Discalimer

This module is still in development (Version **0.9.0** at the moment) and was not yet published to the official NPM repository.

Both audio and video playback is possible, but I don't claim that the **API** is complete.

The **API** offers free command input to **mpv**'s Json IPC protoctol and allows methods for easily adjusting arbitrary *properties* provided by the **mpv API**. With that any command can executed.

## Usage

Simply create an instance of the player

```Javascript
mpvAPI = require("./mpv.js");
mpvPlayer = new mpvAPI();
```

and you're good to go.

You optionally pass a Json object with options to the constructor. Possible options, along with their default values are the following

```Javascript
{
    "verbose": false,
    "debug": false,
    "socket": "/tmp/node-mpv.sock",
    "audio_only": false
}
```

* `verbose` will print various information on the console
* `debug` prints error messages
* `socket` specifies the socket **mpv** opens
* `audio_only` will add the `--no-video` and `--no-audio-display` argument and start **mpv** in audio only mode

You can also provide an optional second argument, an Array containing **mpv** command line options. A list of available arguments can be found in the [documentation](https://mpv.io/manual/stable/#options)

```Javascript
mpvPlayer = new mpvAPI({
	"verbose": true,
	"audio_only": true
},
[
	"--fullscreen",
    "--fps=60"
]);
```

This module provides a lot of different methods to interact with mpv, which can be called directly from the player object.

```Javascript
mpvPlayer.loadFile("/path/to/your/favorite/song.mp3");
mpvPlayer.volume(70);
```

## Methods

### Load Content

* **loadFile** (file)
  
  Will load the `file` and start playing it
  
* **loadStream** (url)
  
  Exactly the same as **loadFile** but loads a stream specified by `url`, for example *YouTube* or *SoundCloud*.
  
### Controlling MPV

* **play** ()

  Starts playback when in *pause* state
  
* **stop** ()

  Stops the playback entirely

* **pause** ()

  Pauses playback
  
* **resume** ()

  Resumes from *pause* mode

* **togglePause** ()

  Toggles the *pause* mode
  
* **mute** ()

  Toggles between *muted* and *unmuted*
  
* **volume** (volumeLevel)

  Sets volume to `volumeLevel`. Allowed values are between **0-100**. All values above and below will just set the volume to **0** or **100** respectively
  
* **adjustVolume** (value)

  Adjusts the volume with the specified `value`. If this results in the volume going below **0** or above **100** it will be set to **0** or **100** respectively
  
* **seek** (seconds)

  Will jump back or forth in the song for the specified amount of `seconds`. Going beyond the duration of  the song results in stop of playback
  
* **goToPosition** (seconds)

  Jumps to the position specified by `seconds`. Going beyond the boundaries of the song results in stop of playback

* **loop** (times)

  Loops the current title `times`often. If set to *"inf"* the title is looped forever
  
### Playlists

  * **loadPlaylist** (playlist, mode="replace")

    Loads a playlist file. `mode` can be one of the two folllowing

      * `replace` *(default)* Replaces the old playist with the new one
      * `append`  Appends the new playlist to the active one

   * **next** (mode="weak")

     Skips the current song. `mode`can be one of the following two

       * `weak` *(default*) If the song is the last song in the playlist it is not skipped
       * `strong` The song is skipped and playback is stopped

   * **prev** (mode="weak")

     Skips the current song. `mode`can be one of the following two

       * `weak` *(default*) If the song is the first song in the playlist it is not stopped
       * `strong` The song is skipped and playback is stopped

   * **clearPlaylist** ()

     Clears the playlist

   * **playlistRemove** (index)

     Removes the song at `index` from the playlist. If `index` is set to "current" the current song is removed and playback stops

   * **playlistMove** (index1, index2)

     Moves the song at `index1` to the position at `index2`

    * **shuffle** ()

      Shuffles the play into a random order



### Audio

* **addAudioTrack** (file, flag, title, lang)

  Adds an audio file to the video that is loaded.
  * `file` The audio file to load
  * `flag` *(optional)* Can be one of "select" (default), "auto" or "cached"
  * `title` *(optional)* The name for the audio track in the UI  
  * `lang` *(optional)* the language of the audio track

  `flag` has the following effects

    * *select* - the added audio track is selected immediately
    * *auto* - the audio track is not selected
    * *cached* - select the audio track, but if a audio track file with the same name is already loaded, the new file is not added and the old one is selected instead

* **removeAudioTrack** ()

  Removes the audio track specified by `id`. Works only for external audio tracks
  
* **selectAudioTrack** (id)

  Selects the audio track associated with `id`
  
* **cycleAudioTracks** ()

 Cycles through the audio tracks
  
* **adjustAudioTiming** (seconds)

  Shifts the audio timing by `seconds`

### Video

* **fullscreen** ()

  Goes into fullscreen mode

* **leaveFullscreen** ()

  Leaves fullscreen mode

* **toggleFullscreen** ()

  Toggles between fullscreen and windowed mode

* **screenshot** (file, option)

  Takes a screenshot and saves it to `file`. `options` is one of the following
  * `subtitles` *(default)* Takes a screenshot including the subtitles
  * `video` Only the image, no texts
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



### Subtitles

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

  Removes the subtitle file specified by `id`. Works only for external subtitle
  
* **selectSubitlte** (id)

  Selects the subtitle associated with `id`
  
* **cycleSubtitles** ()

  Cycles through all available subtitles
  
* **toggleSubtitleVisibility** ()

  Toggles between hidden and visible subtitle
  
* **showSubtitles** ()

  Shows the subtitle
  
* **hideSubtitles** ()

  Hides the subtitles
  
* **adjustSubtitleTiming** (seconds)

  Shifts the subtitle timing by `seconds`

* **subtitleSeek** (lines)

  Jumps as many lines of subtitles as defined by `lines`. Can be negative. This will also seek in the video.
  
* **subitlteScale** (scale)

  Adjust the scale of the subtitles
  

  
### Properties

These methods can be used to alter *properties* or send arbitary *commands* to the running **mpv player**. Information about what *commands* and *properties* are available can be found in the [list of commands](https://mpv.io/manual/stable/#list-of-input-commands) and [list of properties](https://mpv.io/manual/stable/#properties) sections of the **mpv** documentation.

Some important or basic properties are already covered through methods provided by this module.

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

* **getProperty** (property, id)

  Gets the information about the specified `property`. The answers comes in form of an emitted *getrequest* event containing the specified `id`. This unfortunate, but to JavaScript's single threaded and event driven nature, it was the only way I found.
  
* **addProperty** (property, value)

  Increased the `property` by the specified `value`. Needless to say this can only be used on numerical properties. Negative values are possible.
  
* **cycleProperty** (property)

  Cycles the values of an arbitrary property
  
* **command** (command, args)

  Sends the `command` to the **mpv** player with the arguments specified in `args`
  The Json command 
  
  ```Javascript
  `{"command": ["loadfile", "audioSong.mp3"]}`
  ```
  
  becomes a function call	
  
  ```Javascript
  `command("loadfile",["audioSong.mp3"]`
  ```

* **freeCommand** (command)

  This will send an arbitrary *command* to the **mpv player**. It must however follow the specification of the **Json IPC protocol**. Its syntax can be found in the [documentation](https://mpv.io/manual/stable/#json-ipc). 
  
  A trailing "**\n**" will be added to the command.

### Observing
 
 * **observeProperty** (property, id)

   This will add the specified *property* to the *statusupdate* event which is emitted whenever one of the observed properties changes.
  
   The **Id**s **0**-**12** are already taken by the properties which are observed by default.
  
* **unobserveProperty(id)**

  This will remove the property associated with the specified *id* from the *statusupdate*.
  
  Unobserving default properties may break the module.
  
### Events

The **Node-MPV** module provides various *events* to notify about changes of the **mpv player's** state.

* **started**

  Whenever **mpv** starts playing a song or video

* **stopped**

  Whenever the playback has stopped

* **paused**

  Whenever **mpv** was paused

* **resumed**

  Whenever **mpv** was resumed

* **timeposition** \<seconds\>

  When a song or video is currently playing and the playback is not paused, this event will emit the current position in *seconds* roughly every second.

* **getrequest** \<id, data\>

  Delivers the reply to a function call to the *getRequest* method

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
  
  * `filename`
    When playing a local file this contains the filename. When playing for example a *YouTube* stream, this will only contain the trailing url
    
  * `path`
    Provides the absolute path to the music file or the full url of  a stream
    
  * `media-title` If available in the file this will contain the *title*. When streaming from *YouTube* this will be set to the video's name
    
    This object can expanded through the *observeProperty* method making it possible to watch any state you desire, given it is provided by **mpv**
    
## Example

```Javascript
var mpvAPI = require('./mpv.js');
var mpvPlayer = new mpvAPI();

// This will load and start the song
mpvPlayer.loadFile('/path/to/your/favorite/song.mp3');

// This will bind this function to the stopped event
mpvPlayer.on('stopped', function() {
	console.log("Your favorite song just finished, let's start it again!");
    mpvPlayer.loadFile('/path/to/your/favorite/song.mp3');
});

// Stop to song emitting the stopped event
mpvPlayer.stop();
```
   
## ToDo

* Implement WebSocket support


## Changelog

* **0.9.1**
  * Loop function implemented and property added to the default observed values

* **0.9.0**
  * Playlist support added

* **0.8.2**
  * Added function to set the **brightness**, **contrast**, **saturation**, **gamma** and **hue**
  * Added functions to zoom and rotate the video

* **0.8.1**
  * Major code reorganisation
  * [util](https://github.com/defunctzombie/node-util) is no longer required
  * **fullscreen**() was renamed to **toggleFullscreen**()
  * **fullscreen**() enters *fullscreen mode*, **leaveFullscreen**() leaves it
  * **unpause**() renamed to **resume**()
  * **unpaused** event renamed to **resumed**
  * **start** event renamed to **started**

* **0.8.0**
  * Added support for various video related commands
  * Subtitle support

* **0.7.4**
  * Custom command line arguments can now be provided to **mpv**
  * As of this version [lodash](https://lodash.com) **4.0.0** or higher is required
  * Minor fixes

* **0.7.3**
  * Added `audio_only` option
  * Videos are now officially supported, but the API is still missing

* **0.7.2**
  * Options object as paramter for the constructor
  * `debug` and `verbose` flags can be set
  * an arbitrary socket` can be specified

* **0.7.0**
  
  * Added **events**
  
* **0.6.0**

  * Allowed for free **commands**
  * Free **setProperty** and **getProperty** methods

* **0.5.0**

  * **Observing** arbitrary properties

* **0.4.0**

  * Various control methods

* **0.3.0**

  * First API version

* **0.2.0**

  * Implemented communication interface via a local socket to talk to **mpv**