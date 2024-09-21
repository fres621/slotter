import { readFileSync, writeFileSync, createWriteStream } from "fs";
import { join } from "path";
import GIFEncoder from "gif-encoder";
import sharp from "sharp";
import { vtile } from "~/sharp-utils";
import { Worker, isMainThread, workerData } from "worker_threads";

const shapes = ["heart", "grape", "seven", "lemon"].map((shape) =>
    readFileSync(join("assets", "shapes", `${shape}.svg`), "utf-8")
);
const y = (i) => -(142 * (2 - i) - 142 / 2);

const shapesBg = readFileSync("./shapes-bg.svg", "utf-8");
let image = shapesBg.replace(
    '<g id="dynamic" />',
    shapes.map((shape, i) => shape.replace("<svg ", `<svg y="${y(i)}" x="18" width="108" `)).join("\n")
);

writeFileSync("sheet.svg", image);

function easeInOutQuad(x: number) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/** `0 | 1 | 2 | 3` */
type Result = number;

async function createResult(filename: string, result0: Result, result1: Result, result2: Result) {
    const bg = sharp("./assets/base.svg");
    const sheet = await vtile(sharp("./sheet.svg"));
    async function getFrame(index: number, maxIndex: number, result: Result, spins: number) {
        const endpos = Math.floor(84 + 142 * result + 142 * (spins * 4));
        var value = easeInOutQuad(index / maxIndex) * maxIndex;
        const top = Math.round(value * (endpos / maxIndex)) % 568;
        const image = sharp(
            await sharp(await sheet.toBuffer())
                .composite([
                    {
                        top,
                        left: 0,
                        blend: "dest-in",
                        input: "./assets/mask.svg",
                    },
                ])
                .toBuffer()
        ).extract({ width: 142, height: 256, top, left: 0 });
        return image;
    }
    const encoder = new GIFEncoder(512, 512);
    encoder.setTransparent(0x00000000);
    encoder.pipe(createWriteStream(filename));
    encoder.setDelay(25);
    encoder.setRepeat(-1);
    encoder.writeHeader();

    const seconds = 5;
    const maxIndex = seconds * 25;
    const [minimum, maximum] = [6, 11];
    const spins0 = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    const spins1 = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    const spins2 = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

    for (let i = 0; i <= maxIndex; i++) {
        const frame = bg.clone().composite([
            {
                top: 132,
                left: 15,
                input: await getFrame(i, maxIndex, result0, spins0).then((e) => e.toBuffer()),
            },
            {
                top: 132,
                left: 15 + 170,
                input: await getFrame(i, maxIndex, result1, spins1).then((e) => e.toBuffer()),
            },
            {
                top: 132,
                left: 15 + 170 * 2,
                input: await getFrame(i, maxIndex, result2, spins2).then((e) => e.toBuffer()),
            },
        ]);
        encoder.addFrame(await frame.raw().toBuffer());
    }
    encoder.finish();
}
if (isMainThread) {
    for (let i = 0; i < 64; i++) {
        // console.log(i);
        new Worker(__filename, {
            workerData: i,
        });
    }
} else {
    const i = workerData;
    let tile1 = Math.floor(i / 16) % 4;
    let tile2 = Math.floor(i / 4) % 4;
    let tile3 = i % 4;
    setTimeout(() => {
        createResult(`out/result${i}.gif`, tile1, tile2, tile3);
    }, i * 200);
}
