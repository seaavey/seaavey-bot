import crypto from "node:crypto";
import https from "node:https";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import JSZip from "jszip";
import sharp from "sharp";

import type { WASocket } from "baileys";
import type { MessageResolver } from "@/utils/message-resolver";

import { defineCommand } from "@/core/types";
import { imageToSticker } from "@/utils/convert";

const ASSETS_DIR = join(import.meta.dirname, "../../assets/stickers");
const PNG_FILES = readdirSync(ASSETS_DIR)
  .filter((f) => f.endsWith(".png"))
  .sort();

function sha256(buffer: Uint8Array): Buffer {
  return crypto.createHash("sha256").update(buffer).digest();
}

function toB64Url(buffer: Uint8Array): string {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function resizeToWebp(buffer: Uint8Array, size: number): Promise<Buffer> {
  return await sharp(Buffer.from(buffer))
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ lossless: true, quality: 100 })
    .toBuffer();
}

async function resizeToJpeg(buffer: Uint8Array, size: number): Promise<Buffer> {
  return await sharp(Buffer.from(buffer))
    .resize(size, size, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .jpeg({ quality: 90 })
    .toBuffer();
}

interface IqNode {
  tag: string;
  attrs?: Record<string, unknown>;
  content?: IqNode[];
}

interface UploadResult {
  mediaKey: Buffer;
  fileLength: number;
  fileSha256: Buffer;
  fileEncSha256: Buffer;
  directPath: string;
}

async function uploadToServer(
  conn: WASocket,
  buffer: Uint8Array,
  opts: { hkdf: string; mediaPath: string; mediaKey?: Buffer },
): Promise<UploadResult> {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const mediaKey = opts.mediaKey ?? crypto.randomBytes(32);
  const expanded = Buffer.from(
    crypto.hkdfSync("sha256", mediaKey, Buffer.alloc(32), Buffer.from(opts.hkdf), 112),
  );

  const iv = expanded.subarray(0, 16);
  const cipherKey = expanded.subarray(16, 48);
  const macKey = expanded.subarray(48, 80);

  const cipher = crypto.createCipheriv("aes-256-cbc", cipherKey, iv);
  const encrypted = Buffer.concat([cipher.update(buf), cipher.final()]);

  const mac = crypto
    .createHmac("sha256", macKey)
    .update(iv)
    .update(encrypted)
    .digest()
    .subarray(0, 10);
  const encBuffer = Buffer.concat([encrypted, mac]);

  const fileSha256 = sha256(buf);
  const fileEncSha256 = sha256(encBuffer);

  const iq = (await conn.query({
    tag: "iq",
    attrs: {
      id:
        typeof conn.generateMessageTag === "function"
          ? conn.generateMessageTag()
          : Date.now().toString(),
      to: "s.whatsapp.net",
      type: "set",
      xmlns: "w:m",
    },
    content: [{ tag: "media_conn", attrs: {} }],
  })) as unknown as IqNode;

  const mediaConn = iq.content?.find((v) => v.tag === "media_conn");
  const auth = mediaConn?.attrs?.auth as string | undefined;
  if (!auth) throw new Error("Gagal mendapatkan auth media_conn");

  const hosts = (mediaConn?.content ?? [])
    .filter((v) => v.tag === "host")
    .map((v) => v.attrs?.hostname as string | undefined)
    .filter((v): v is string => Boolean(v));

  if (!hosts.length) throw new Error("Tidak ada host upload");

  const token = encodeURIComponent(
    fileEncSha256.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""),
  );

  let lastError: Error | undefined;

  for (const host of hosts) {
    try {
      const json = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const req = https.request(
          {
            hostname: host,
            port: 443,
            path: `${opts.mediaPath}/${token}?auth=${encodeURIComponent(auth)}&token=${token}`,
            method: "POST",
            headers: {
              Origin: "https://web.whatsapp.com",
              "Content-Type": "application/octet-stream",
              "Content-Length": encBuffer.length,
            },
          },
          (res) => {
            let body = "";
            res.on("data", (c: string) => {
              body += c;
            });
            res.on("end", () => {
              const sc = res.statusCode ?? 500;
              if (sc < 200 || sc >= 300) {
                reject(new Error(`${sc} ${body}`));
              } else {
                resolve(JSON.parse(body));
              }
            });
          },
        );
        req.on("error", reject);
        req.write(encBuffer);
        req.end();
      });

      const directPath = (json.direct_path ?? json.directPath ?? json.url ?? json.path) as
        string | undefined;
      if (!directPath) throw new Error("directPath kosong");

      return { mediaKey, fileLength: buf.length, fileSha256, fileEncSha256, directPath };
    } catch (e) {
      lastError = e as Error;
    }
  }

  throw lastError ?? new Error("Semua host gagal");
}

interface StickerMeta {
  fileName: string;
  isAnimated: boolean;
  emojis: string[];
  accessibilityLabel: string;
  isLottie: boolean;
  mimetype: string;
}

async function sendStickerPack(
  conn: WASocket,
  m: MessageResolver,
  stickers: { buffer: Buffer; ext: string; mimetype: string }[],
): Promise<void> {
  const zip = new JSZip();

  const meta: StickerMeta[] = [];

  for (const s of stickers) {
    const name = `${toB64Url(sha256(s.buffer))}.${s.ext}`;
    zip.file(name, s.buffer);
    meta.push({
      fileName: name,
      isAnimated: false,
      emojis: [""],
      accessibilityLabel: "",
      isLottie: false,
      mimetype: s.mimetype,
    });
  }

  const first = stickers[0];
  if (!first) throw new Error("Tidak ada sticker untuk tray icon");
  const tray = await resizeToWebp(first.buffer, 252);
  zip.file("tray_icon.webp", tray);

  const archive = await zip.generateAsync({ type: "nodebuffer", compression: "STORE" });

  const packUpload = await uploadToServer(conn, archive, {
    hkdf: "WhatsApp Sticker Pack Keys",
    mediaPath: "/mms/sticker-pack",
  });

  const thumb = await resizeToJpeg(tray, 252);

  const thumbUpload = await uploadToServer(conn, thumb, {
    hkdf: "WhatsApp Sticker Pack Thumbnail Keys",
    mediaPath: "/mms/thumbnail-sticker-pack",
    mediaKey: packUpload.mediaKey,
  });

  await conn.relayMessage(
    m.jid,
    {
      messageContextInfo: { messageSecret: crypto.randomBytes(32) },
      stickerPackMessage: {
        stickerPackId: "Pack_" + crypto.randomBytes(8).toString("hex"),
        name: "SeaaveyBot",
        publisher: "Seaavey",
        packDescription: "Sticker dari asset PNG",
        stickers: meta,
        fileLength: packUpload.fileLength,
        fileSha256: packUpload.fileSha256,
        fileEncSha256: packUpload.fileEncSha256,
        mediaKey: packUpload.mediaKey,
        directPath: packUpload.directPath,
        mediaKeyTimestamp: Math.floor(Date.now() / 1000),
        stickerPackSize: packUpload.fileLength,
        stickerPackOrigin: 2,
        trayIconFileName: "tray_icon.webp",
        thumbnailDirectPath: thumbUpload.directPath,
        thumbnailSha256: thumbUpload.fileSha256,
        thumbnailEncSha256: thumbUpload.fileEncSha256,
        thumbnailHeight: 252,
        thumbnailWidth: 252,
        imageDataHash: thumbUpload.fileSha256.toString("base64"),
      },
    },
    {},
  );
}

export default defineCommand({
  name: "StickerPackExample",
  command: "tspk",
  tags: ["owner", "sticker"],
  description: "Kirim sticker pack dari 9 asset PNG (example)",
  ownerOnly: true,
  handler: async (sock, msg) => {
    if (!PNG_FILES.length) return msg.reply(`Tidak ada file PNG di ${ASSETS_DIR}`);

    await msg.reply(`Mengkonversi ${PNG_FILES.length} sticker...`);

    const stickers: { buffer: Buffer; ext: string; mimetype: string }[] = [];

    for (const file of PNG_FILES) {
      const png = readFileSync(join(ASSETS_DIR, file));
      const webp = await imageToSticker(png);
      stickers.push({ buffer: webp, ext: "webp", mimetype: "image/webp" });
    }

    await msg.reply("Upload sticker pack ke WhatsApp...");

    try {
      await sendStickerPack(sock, msg, stickers);
    } catch (e) {
      return msg.reply(`Gagal: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
});
