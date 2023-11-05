# OptiHero
Clone Hero chart optimizer. OptiHero converts common Clone Hero chart formats to more efficient ones and removes unnecessary files.
* Audio files are converted to Opus 96kbps/48kbps (Supported in version 1.0+)
* Image files are converted to JPG (Quality 70). Album cover is scaled to 500x500, background is scaled to 3840x2160.
* Video files are converted to WebM (libvpx crf=26 maxrate=2M, no audio, max 720p).
* `song.ini`, `notes.chart` and `notes.mid` are kept intact. All other files not used by the game are removed.

# Usage
Install FFmpeg and it to your path. Install the dependencies and run `node . "/path/to/songs/goes/here"`. All songs will recursively be optimized.