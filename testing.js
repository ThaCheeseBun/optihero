import { createReadStream } from "fs";



const stream = createReadStream("album.jpg");
stream.once('readable', () => {
    const data = stream.read(8);
    console.log(data.equals(png_header));
    console.log(data.subarray(0, 3).equals(jpg_header))
});

