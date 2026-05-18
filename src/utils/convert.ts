/**
 * @module convert
 * @description Image/video to sticker converter using ffmpeg + node-webpmux
 */

import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Image } from "node-webpmux";

interface StickerOptions {
  pack?: string;
  author?: string;
}

function buildExif(pack: string, author: string): Buffer {
  const json = JSON.stringify({
    "sticker-pack-id": "seaaveybot",
    "sticker-pack-name": pack,
    "sticker-pack-publisher": author,
    emojis: ["✨"],
  });
  const exif = Buffer.concat([
    Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]),
    Buffer.from(json, "utf-8"),
  ]);
  exif.writeUIntLE(Buffer.byteLength(json, "utf-8"), 14, 4);
  return exif;
}

async function addExif(webpBuffer: Buffer, pack: string, author: string): Promise<Buffer> {
  const img = new Image();
  await img.load(webpBuffer);
  img.exif = buildExif(pack, author);
  return await img.save(null);
}

/**
 * Convert image buffer to WebP sticker
 */
export async function imageToSticker(buffer: Buffer, opts: StickerOptions = {}): Promise<Buffer> {
  const tmp = mkdtempSync(join(tmpdir(), "sticker-"));
  const input = join(tmp, "input");
  const output = join(tmp, "output.webp");

  try {
    writeFileSync(input, buffer);
    execSync(
      `ffmpeg -i ${input} -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -vcodec libwebp -lossless 0 -quality 80 -compression_level 6 ${output}`,
      { stdio: "ignore" },
    );
    const webp = readFileSync(output);
    return addExif(webp, opts.pack || "SeaaveyBot", opts.author || "Seaavey");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Convert video buffer to animated WebP sticker (max 10s)
 */
export async function videoToSticker(buffer: Buffer, opts: StickerOptions = {}): Promise<Buffer> {
  const tmp = mkdtempSync(join(tmpdir(), "sticker-"));
  const input = join(tmp, "input.mp4");
  const output = join(tmp, "output.webp");

  try {
    writeFileSync(input, buffer);
    execSync(
      `ffmpeg -i ${input} -t 10 -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,fps=15" -vcodec libwebp -loop 0 -preset default -an -vsync 0 -quality 50 ${output}`,
      { stdio: "ignore" },
    );
    const webp = readFileSync(output);
    return addExif(webp, opts.pack || "SeaaveyBot", opts.author || "Seaavey");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Convert video/audio buffer to MP3
 */
export function toMp3(buffer: Buffer): Buffer {
  const tmp = mkdtempSync(join(tmpdir(), "audio-"));
  const input = join(tmp, "input");
  const output = join(tmp, "output.mp3");

  try {
    writeFileSync(input, buffer);
    execSync(`ffmpeg -i ${input} -vn -ar 44100 -ac 2 -b:a 128k ${output}`, {
      stdio: "ignore",
    });
    return readFileSync(output);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Convert WebP sticker to PNG image
 */
export function stickerToImage(buffer: Buffer): Buffer {
  const tmp = mkdtempSync(join(tmpdir(), "toimg-"));
  const input = join(tmp, "input.webp");
  const output = join(tmp, "output.png");

  try {
    writeFileSync(input, buffer);
    execSync(`ffmpeg -i ${input} -frames:v 1 ${output}`, { stdio: "ignore" });
    return readFileSync(output);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
