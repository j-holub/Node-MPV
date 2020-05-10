# Node-MPV Changelog

* **2.0.0**
  * The 1.\*.\* API is no longer valid
  * Added a `start()` and `quit()` method. MPV is not started automatically on initialization. `start()` has to be called
  * Every method returns a **Promise** to is resolved if it worked and rejected if it didn't
  * Added a proper error message object to tell you what went wrong
  * The `statuschange` event was renamed to `status` and now fires for properties independently
  * `load()`, `append()`, `loadPlaylist()`, `prev()` and `next()` are a lot more robust and check if the file or stream could be played or not
  * Added the possibility to hook into a running instance of **mpv**
  * `start()` can also take mpv arguments
  * `mute()`, `unmute()` and `toggleMute()` are now one function `mute()` that can take a boolean as an argument
  * `loop()` can now also toggle the mute state by not passing an argument
  * `loopPlaylist()` and `clearLoopPlaylist()` were combined into `loopPlaylist()`, which works exactly as `loop()`
  * Removed the IDs from `observeProperty()`. It's all handled in the background now
  * Added a lot of *Information Methods*
  * `goto()` was renamed to `jump()`
  * Removed *deprecated* methods from **Version1**, namely `loadFile()` and `loadStream()`
  * Removed `lodash` as a dependency
  * Removed `Promise` as a dependency
  * Removed `cuid` as a dependency



### Version 1

* **1.5.0**
  * Changed `loop()` such that it loops foreveer if no argument is passed. Passing `inf` still works
  * Added a `loopPlaylist()` function, that works exactly as `loop()`, but for playlists
  * Added a `clearLoop()` method, that stops looping the current trac
  * Added a `clearLoopPlaylist()` method, that stops looping the playlist

* **1.4.3**
  * Another fix to determine the *ipc command* for self compiled versions of **mpv**
  * Fixed multiple options for `load` and `append` not working

* **1.4.2**
  * Fixed the verison number check to determine the *ipc command* for **mpv** 0.28.0 and later

* **1.4.1**
  * Changed `selectSubtitle()` to `selectSubtitles()`
  * Documentation type fixes in the *subitle* section (Thanks to @p1100i)

* **1.4.0**
  * Added a new method `commandJSON()`
  * Added an *options* parameter to the `load()` and `append()` methods to pass additional options to **mpv**
  * Added a method `displayASS()` to make using *ass-formatted* subtitles easier. (Thanks to @AxelTerizaki)

* **1.3.1**
  * Fixes `next()` and `prev()`. The mode was not propagated to **mpv** and instead of **strong** it is actually **force*

* **1.3.0**
  * Added **seek** event
  * Deprecated `loadFile()` and `loadStream()` which are replaced by `load()``

* **1.2.1**
  * Some bugfixes for Windows (Thanks to @vankasteelj)

* **1.2.0**
  * Added a **quit** function. (Thanks to @KeyserSoze1 for the intial help)
  * Deprecated **getProperty**(property, id). The promise version should be used instead


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
