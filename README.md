# OptiHero
Clone Hero chart optimizer.

# Usage
Install **FFmpeg** and **FFprobe** and add them to your path.\
Install all dependencies using `npm i`.\
Example:
```
node . "C:\\Games\\Clone Hero\\Songs"
```
The script will recursively convert all files in the specified directory.

# How does it work?
OptiHero converts common Clone Hero chart formats to more efficient ones.
* Audio converts to [Opus](https://opus-codec.org) (Only supported in PTB)
* Images converts to JPG (Quality 60)

# TODO
* ~~Optimize audio~~
* ~~Optimize images~~
* Optimize videos
* Optimize notes/chart
