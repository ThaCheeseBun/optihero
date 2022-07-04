import { resolve, relative, extname } from "path";
import { createReadStream } from "fs";
import { readdir, stat, rm } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { EOL } from "os";

import { decode, encode } from "jpeg-js";
import { PNG } from "pngjs";

// promise version of exec
const execAsync = promisify(exec);

// walkdir function
// https://stackoverflow.com/a/45130990/10676520
async function* getFiles(dir)
{
    const dirents = await readdir(dir, { withFileTypes: true });
    for (const dirent of dirents)
    {
        const res = resolve(dir, dirent.name);
        if (dirent.isDirectory())
            yield* getFiles(res);
        else
            yield res;
    }
}

// helper function for decoding images
async function decodeImg(p)
{
    const png_header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const jpg_header = Buffer.from([0xFF, 0xD8, 0xFF]);

    // init stuff
    const stream = createReadStream(p);

    // figure out format
    const data = stream.read(8);
    if (data.equals(png_header))
    console.log();
    console.log(data.subarray(0, 3).equals(jpg_header))
}

// wrap main function
(async () => {

    // we need a path jesse
    if (process.argv.length < 3)
        return console.error("no path given");

    // check if it exists / has permission / whatever
    const p = process.argv[2];
    try
    {
        await stat(p);
    }
    catch (e)
    {
        console.error("no exist");
        return process.exit(0);
    }

    // loop through each file
    for await (const f of getFiles(p))
    {
        const ext = extname(f);

        // log progress
        console.log(relative(p, f));

        // switch for each supported format
        switch (ext)
        {

            // music file optimzing
            case ".ogg":
            case ".mp3":

                // get bit rate of original
                const probe = await execAsync([
                    "ffprobe",
                    "-i", `"${f}"`,
                    "-v", "error",
                    "-show_entries", "stream=bit_rate",
                ].join(" "));
                const probe_out = probe.stdout.split(EOL)[1];

                // assume original is 256 kbit/s if none specified
                let bit_rate = 128000;
                if (probe_out.startsWith("bit_rate"))
                    // use original bitrate divided by two
                    // gives roughly the same quality
                    bit_rate = Number(probe_out.split("=")[1]) / 2;

                // process file to opus
                await execAsync([
                    "ffmpeg",
                    "-i", `"${f}"`,
                    "-map", "0:a",
                    "-b:a", bit_rate,
                    `"${f.replace(extname(f), ".opus")}"`
                ].join(" "));

                // remove original
                await rm(f);
                break;
            
            // image optimizing
            case ".png":
            case ".jpg":
            case ".jpeg":
                
                break;

        }
    }

})();
