# Node-MPV

This is an NPM Module to control **[mpv player](https://github.com/mpv-player/mpv)** through the IPC Json API.

It keeps MPV running in the background all the time and provides an easy-to-use interface.

**This module requires mpv to be installed on your system to work**


## Discalimer

This module is still in development (Version **0.7.0** at the moment) and was not yet published to the official NPM repository.

So far this module officially only provides usage for audio playback and still lacks playlist support. It will also only work with local sockets so far.

The  API provides however functions to freely send any command to the **mpv player**. This can be used to change properties concerning Video playback as well.

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
    "socket": "/tmp/node-mpv.sock"
}
```

* `verbose` will print various information on the console
* `debug` prints error messages
* `socket` specifies the socket **mpv** opens

This module provides a lot of different methods to interact with mpv, which can be called directly from the player object.

```Javascript
mpvPlayer.loadFile("/path/to/your/favorite/song.mp3");
mpvPlayer.volume(70);
```

## Methods

### Load Content

* **loadFile** (file)
  
  Will load the file and start playing it
  
* **loadStream** (url)
  
  Exactly the same as **loadFile** but loads a Stream from an url, for example *YouTube* or *SoundCloud*.
  
### Controlling MPV

* **play** ()

  Starts playback when in *pause* state
  
* **stop** ()

  Stops the playback entirely

* **pause** ()

  Pauses playback
  
* **unpause** ()

  Unpauses from *pause* mode

* **togglePause** ()

  Toggles the *pause* mode
  
* **mute** ()

  Toggles between *muted* and *unmuted*
  
* **volume** (volumeLevel)

  Sets volume to *volumeLevel*. Allowed values are between **0-100**. All values above and below will just set the volume to **0** or **100** respectively
  
* **adjustVolume** (value)

  Adjusts the volume with the specified *value*. If this results in the volume going below **0** or above **100** it will be set to **0** or **100** respectively
  
* **seek** (seconds)

  Will jump back or forth in the song for the specified amount of *seconds*. Going beyond the duration of  the song results in stop of playback
  
* **goToPosition** (seconds)

  Jumps to the position specified by *seconds*. Going beyond the boundaries of the song results in stop of playback
  
### Setting Properties

These methods can be used to alter *properties* or send arbitary *commands* to the running **mpv player**. Information about what *commands* and *properties* are available can be found in the [list of commands](https://mpv.io/manual/stable/#list-of-input-commands) and [list of properties](https://mpv.io/manual/stable/#properties) sections of the **mpv** documentation.

Some important or basic properties are already covered through methods provided by this module.

* **setProperty** (property, value)

  Sets the specified *property* to the specified *value*

* **setMultipleProperties** (properties)

  Calls **setProperty** for every property specified in the arguments Json object. For example
  
  ```Javascript
  setMultipleProperties({
  		"volume": 70,
        "fullscreen": true
  });
  ```
  
* **getProperty** (property, id)

  Gets the information about the specified *property*. The answers comes in form of an emitted *getrequest* event containing the specified *id*. This unfortunate, but to JavaScript's single threaded and event driven nature, it was the only way I found.
  
* **addProperty** (property, value)

  Increased the *property* by the specified *value*. Needless to say this can only be used on numerical properties.
  
* **observeProperty** (property, id)

  This will add the specified *property* to the *statusupdate* event which is emitted whenever one of the observed properties changes.
  
  The **Id**s **0**-**7** are already taken by the properties which are observed by default.
  
* **unobserveProperty(id)**

  This will remove the property associated with the specified *id* from the *statusupdate*.
  
  Unobserving default properties may break the module.
  
* **command** (command)

  This will send an arbitrary *command* to the **mpv player**. It must however follow the specification of the **Json IPC protocol**. Its syntax can be found in the [documentation](https://mpv.io/manual/stable/#json-ipc). 
  
  A trailing "**\n**" will be added to the command.
  
### Events

The **Node-MPV** module provides various *events* to notify about changes of the **mpv player's** state.

* **start**

  Whenever **mpv** starts playing a song or video

* **stopped**

  Whenever the playback has stopped

* **paused**

  Whenever **mpv** was paused

* **unpaused**

  Whenever **mpv** was unpaused

* **timeposition** \<seconds\>

  When a song or video is currently playing and the playback is not paused, this event will emit the current position in *seconds* roughly every second.

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
    "media-title": null
  }
  ```
  
  This object can expanded through the *observeProperty* method making it possible to watch any state you desire, given it is provided by **mpv**
  
  * *filename*
  
    When playing a local file this contains the filename. When playing for example a *YouTube* stream, this will only contain the trailing url
    
  * *path*

    Provides the absolute path to the music file or the full url of  a stream
    
  * *media-title*

    If available in the file this will contain the *title*. When streaming from *YouTube* this will be set to the video's name
    
    
## Example

```Javascript
var mpvAPI = require('./mpv.js');
var mpvPlayer = new mpvAPI();

// This will load and start the song
mpvPlayer.loadFile('/path/to/your/favorite/song.mp3');

// This will bind this function to the stopped event
mpvPlayer.on('stopped', function() {
	console.log("My favorite song just finished");
});

// Stop to song emitting the stopped event
mpvPlayer.stop();
```
   
## ToDo

* Allow custom arguments
* Implement WebSocket support
* Add playlist support
* Add proper video support


## Changelog

* **0.7.2**
  * Options object as paramter for the constructor
  * **debug** and **verbose** flags can be set
  * an arbitrary **socket** can be specified

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