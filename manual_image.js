import { readFile, writeFile } from "fs/promises";

import { decode, encode } from "jpeg-js";
import { PNG } from "pngjs";

const parseAsync = function (data) {
    return new Promise((res, rej) => {
        new PNG({ colorType: 2 }).parse(data, (e, d) => {
            if (e) rej(e);
            else res(d);
        })
    });
};

(async () => {

    if (process.argv.length < 3)
        return console.error("no path given");

    const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const JPG_HEADER = Buffer.from([0xFF, 0xD8, 0xFF]);

    // read input file
    const data = await readFile(process.argv[2]);

    // figure out format
    let raw = null;
    if (data.subarray(0, 8).equals(PNG_HEADER))
        raw = await parseAsync(data);
    else if (data.subarray(0, 3).equals(JPG_HEADER))
        raw = decode(data);

    // encode jpg
    const out = encode({
        data: raw.data,
        width: raw.width,
        height: raw.height,
    }, 60);

    await writeFile("album.jpg", out.data);

})();