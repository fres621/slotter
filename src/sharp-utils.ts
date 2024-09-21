import sharp from "sharp";

/** Vertically tiles an image */
async function vtile(img: sharp.Sharp): Promise<sharp.Sharp> {
  const { height } = await img.metadata();
  const sheet = await img.toBuffer();
  return img.extend({ bottom: height }).composite([
    {
      gravity: sharp.gravity.south,
      input: sheet,
    },
  ]);
}

export { vtile };
