# Node-MPV Changelog


* **2.0.0**
  * The 1.*.* API is no longer valid
  * Added a `start()` and `quit()` method
  * MPV is not started automatically on initialization. `start()` has to be called
  * Every method returns a **Promise** to is resolved if it worked and rejected if it didn't
  * Added a proper error message object to tell you what went wrong
  * Overall better error checking
  * `load()`, `append()`, `loadPlaylist()`, `prev()` and `next()` are a lot more robust and check if the file or stream could be played or not
  * Added a lot **Information Methods*
  * Removed lodash as a dependency
  * Removed Pormise as a dependency
  * Changed CUID dependency to **2.1.1** to remove the memory footprint (Thanks to @AxelTerizaki)
  * Removed *deprecated* methods from **Version1**, namely `loadFile()` and `loadStream()`

### Version 1

* **1.1.2**
  * Accidentally committed way more than desired. This fixes the mess

* **1.1.1**
  * Added a default socket for Windows. The OS is detected automatically (Thanks to @danickfort)
  * 1.1.0 was unpublished and skipped due to a bug

* **1.0.3**
  * made the module `use strict` compliant (Thanks to @jeffnappi)

* **1.0.2**
  * Documentation fix

* **1.0.1**
  * Fixed the bug, that MPV Player won't be restarted correctly when it crashed a second time (Thanks to @SkyZH)

* **1.0.0**
  * getProperty is able to return a promise, making its use a lot more comfortable (Thanks to @iamale)

### Pre 1.0.0  

* **0.13.0**
  * **API Chnage:** `mute`'s behaviour was changed to set the player to *mute*
  * `unmute` method added to unmute the player
  * `toggleMute` method added to toggle between *mute* and *unmute* (former `mute`'s behaviour')

* **0.12.2**
  * Fixed the version check when the user provides his/her own binary (Thanks to @SkyZH)

* **0.12.1**
  * Fixed the **loop** method (Thanks to @f00a04b4f13eec8a254e44cd529d4c88)

* **0.12.0**
  * The user can provide the path to a mpv binary in case mpv player is not in the PATH (Thanks to @iamale)

* **0.11.0**
  * The code to determine the correct ipc command is now more robust
  * Added option to pass the ipc command by hand (Thanks to @wendelb)

* **0.10.0**
  * The command line argument for the IPC socket has changed in mpv version **0.17.0**. The module didn't work for older Versions of mpv. This is fixed now

* **0.9.6**
  * The interval, how often the timeposition event occurs can now be set to any value

* **0.9.5**
  * Fixed Meteor support

* **0.9.4**
  * Fixed EventListener leak bug

* **0.9.3**
  * Added **append** functionality for playlists

* **0.9.1**
  * **Loop** function implemented and property added to the default observed values
  * **MultiplyProperty** added offer more free interaction with mpv
  * Added a function to adjust the playback **speed**

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
