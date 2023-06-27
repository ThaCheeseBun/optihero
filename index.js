import { resolve, relative, extname, basename } from "node:path";
import { readdir, stat, rm, rename } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import Jimp from "jimp";

// all files the game uses
const AUDIO_FILES = [
    "guitar", "bass", "rhythm", "vocals", "vocals_1", "vocals_2", "drums", "drums_1", "drums_2", "drums_3", "drums_4", "keys", "song", "crowd",
    "preview"
];
const IMAGE_FILES = [
    "album", "background", "highway"
];
const VIDEO_FILES = [
    "video"
];
const OTHER_FILES = [
    "song.ini", "notes.mid", "notes.chart"
];

// promise version of other functions
const execAsync = promisify(exec);

// walkdir function
// https://stackoverflow.com/a/45130990/10676520
async function* getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* getFiles(res);
        } else {
            yield res;
        }
    }
}

// we need a path jesse
if (process.argv.length < 3) {
    console.error("please specify a path.");
    process.exit(1);
}

// check if it exists / has permission / whatever
const p = resolve(process.argv[2]);
try {
    await stat(p);
} catch (e) {
    console.error("can't access path. does it exist?");
    process.exit(1);
}

// loop through each file
for await (const f of getFiles(p)) {
    // log progress
    console.log(relative(p, f));
    const base = basename(f, extname(f)).toLowerCase();

    // switch for each supported format
    switch (extname(f).toLowerCase()) {

        // music file optimzing
        case ".ogg":
        case ".mp3":
        case ".wav":
        case ".opus":

            // check if used by the game
            if (!AUDIO_FILES.includes(base)) {
                await rm(f);
                break;
            }

            // probe original info
            const probe_str = await execAsync([
                "ffprobe",
                "-i", `"${f}"`,
                "-v", "error",
                "-of", "json",
                "-show_streams"
            ].join(" "));
            const probe = JSON.parse(probe_str.stdout);
            const audios = probe.streams.filter(x => x.codec_type === "audio");

            // eh, yeah thats broken
            if (audios.length < 0) {
                console.error("\n[ERROR] No audio tracks present, skipping.\n");
                break;
            }

            // process file to opus
            const temp = f.replace(extname(f), ".opus.optihero");
            await execAsync([
                "ffmpeg",
                "-i", `"${f}"`,
                "-map", "0:a:0",
                "-c", "libopus",
                "-ac", audios[0].channels === 1 ? 1 : 2,
                "-b:a", (audios[0].channels === 1 ? 48 : 96) * 1000,
                "-f", "ogg",
                `"${temp}"`
            ].join(" "));

            // remove original
            await rm(f);

            // move temp to replace
            await rename(temp, temp.replace(".optihero", ""));
            break;

        // image optimizing
        case ".png":
        case ".jpg":
        case ".jpeg":

            // again, check if used by the game
            if (!IMAGE_FILES.includes(base)) {
                await rm(f);
                break;
            }

            // read input file
            const img = await Jimp.read(f);

            // remove original
            await rm(f);

            // resize image
            if (base === "album" && (img.getWidth() > 500 || img.getHeight() > 500)) {
                img.scaleToFit(500, 500, Jimp.RESIZE_BICUBIC);
            } else if (base === "background" && (img.getWidth() > 3840 || img.getHeight() > 2160)) {
                img.scaleToFit(3840, 2160, Jimp.RESIZE_BICUBIC);
            }

            // set jpeg quality
            img.quality(70);

            await img.writeAsync(f.replace(extname(f), ".jpg"));
            break;

        // video optimizing
        case ".mp4":
        case ".avi":
        case ".webm":
        case ".vp8":
        case ".ogv":
        case ".mpeg":

            // again, check if used by the game
            if (!VIDEO_FILES.includes(base)) {
                await rm(f);
                break;
            }

            // just do the thing
            const temp2 = f.replace(extname(f), ".mp4.optihero");
            await execAsync([
                "ffmpeg",
                "-i", `"${f}"`,
                "-map", "0:v:0",
                "-c", "libx264",
                "-crf", "26",
                "-preset", "veryslow",
				"-vf", "\"scale=-2:'min(720,ih)'\"",
                "-f", "mp4",
                `"${temp2}"`
            ].join(" "));

            // remove original
            await rm(f);

            // move temp to replace
            await rename(temp2, temp2.replace(".optihero", ""));
            break;

        // remove unnecessary files
        default:
            if (!OTHER_FILES.includes(basename(f).toLowerCase())) {
                await rm(f);
            }

    }
}