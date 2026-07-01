import { downloadMediaMessage, type WAMessage, type proto } from "baileys";
import { defineCommand } from "@/core/types";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

type MediaMessage =
  | proto.Message.IImageMessage
  | proto.Message.IVideoMessage
  | proto.Message.IAudioMessage
  | proto.Message.IStickerMessage
  | proto.Message.IDocumentMessage;

export default defineCommand({
  name: "Save Media",
  alias: ["savemedia", "svmedia"],
  description:
    "Save media (image, video, audio, sticker, document) from message or reply to /dev folder on server",
  usage: "{prefix}savemedia [nama_file]",
  tags: ["media"],
  ownerOnly: true,
  handler: async (sock, msg) => {
    const rawQuoted = msg.raw.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    let mediaType: string | null = null;
    let mediaObject: MediaMessage | null | undefined = null;
    let isQuoted = false;

    if (msg.message?.imageMessage) {
      mediaType = "imageMessage";
      mediaObject = msg.message.imageMessage;
    } else if (msg.message?.videoMessage) {
      mediaType = "videoMessage";
      mediaObject = msg.message.videoMessage;
    } else if (msg.message?.audioMessage) {
      mediaType = "audioMessage";
      mediaObject = msg.message.audioMessage;
    } else if (msg.message?.stickerMessage) {
      mediaType = "stickerMessage";
      mediaObject = msg.message.stickerMessage;
    } else if (msg.message?.documentMessage) {
      mediaType = "documentMessage";
      mediaObject = msg.message.documentMessage;
    } else if (msg.message?.documentWithCaptionMessage?.message?.documentMessage) {
      mediaType = "documentMessage";
      mediaObject = msg.message.documentWithCaptionMessage.message.documentMessage;
    } else if (msg.message?.viewOnceMessage?.message?.imageMessage) {
      mediaType = "imageMessage";
      mediaObject = msg.message.viewOnceMessage.message.imageMessage;
    } else if (msg.message?.viewOnceMessage?.message?.videoMessage) {
      mediaType = "videoMessage";
      mediaObject = msg.message.viewOnceMessage.message.videoMessage;
    } else if (msg.message?.viewOnceMessageV2?.message?.imageMessage) {
      mediaType = "imageMessage";
      mediaObject = msg.message.viewOnceMessageV2.message.imageMessage;
    } else if (msg.message?.viewOnceMessageV2?.message?.videoMessage) {
      mediaType = "videoMessage";
      mediaObject = msg.message.viewOnceMessageV2.message.videoMessage;
    } else if (msg.message?.viewOnceMessageV2Extension?.message?.imageMessage) {
      mediaType = "imageMessage";
      mediaObject = msg.message.viewOnceMessageV2Extension.message.imageMessage;
    } else if (msg.message?.viewOnceMessageV2Extension?.message?.videoMessage) {
      mediaType = "videoMessage";
      mediaObject = msg.message.viewOnceMessageV2Extension.message.videoMessage;
    } else if (rawQuoted) {
      isQuoted = true;
      if (rawQuoted.imageMessage) {
        mediaType = "imageMessage";
        mediaObject = rawQuoted.imageMessage;
      } else if (rawQuoted.videoMessage) {
        mediaType = "videoMessage";
        mediaObject = rawQuoted.videoMessage;
      } else if (rawQuoted.audioMessage) {
        mediaType = "audioMessage";
        mediaObject = rawQuoted.audioMessage;
      } else if (rawQuoted.stickerMessage) {
        mediaType = "stickerMessage";
        mediaObject = rawQuoted.stickerMessage;
      } else if (rawQuoted.documentMessage) {
        mediaType = "documentMessage";
        mediaObject = rawQuoted.documentMessage;
      } else if (rawQuoted.documentWithCaptionMessage?.message?.documentMessage) {
        mediaType = "documentMessage";
        mediaObject = rawQuoted.documentWithCaptionMessage.message.documentMessage;
      } else if (rawQuoted.viewOnceMessage?.message?.imageMessage) {
        mediaType = "imageMessage";
        mediaObject = rawQuoted.viewOnceMessage.message.imageMessage;
      } else if (rawQuoted.viewOnceMessage?.message?.videoMessage) {
        mediaType = "videoMessage";
        mediaObject = rawQuoted.viewOnceMessage.message.videoMessage;
      } else if (rawQuoted.viewOnceMessageV2?.message?.imageMessage) {
        mediaType = "imageMessage";
        mediaObject = rawQuoted.viewOnceMessageV2.message.imageMessage;
      } else if (rawQuoted.viewOnceMessageV2?.message?.videoMessage) {
        mediaType = "videoMessage";
        mediaObject = rawQuoted.viewOnceMessageV2.message.videoMessage;
      } else if (rawQuoted.viewOnceMessageV2Extension?.message?.imageMessage) {
        mediaType = "imageMessage";
        mediaObject = rawQuoted.viewOnceMessageV2Extension.message.imageMessage;
      } else if (rawQuoted.viewOnceMessageV2Extension?.message?.videoMessage) {
        mediaType = "videoMessage";
        mediaObject = rawQuoted.viewOnceMessageV2Extension.message.videoMessage;
      }
    }

    if (!mediaType || !mediaObject) {
      return msg.reply("🚩 Reply/send media with caption .savemedia");
    }

    await msg.reply("⏳ Downloading media...");

    try {
      const downloadMsg = isQuoted
        ? {
            message: { [mediaType]: mediaObject },
            key: { ...msg.key, id: msg.quoted?.id, participant: msg.quoted?.sender },
          }
        : msg.raw;

      const buffer = (await downloadMediaMessage(downloadMsg as WAMessage, "buffer", {
        host: "mmg.whatsapp.net",
      })) as Buffer;

      if (!buffer) {
        throw new Error("Failed to download media from WhatsApp server.");
      }

      let fileName = msg.args.join("_").trim();
      if (!fileName) {
        if (mediaType === "documentMessage" && "fileName" in mediaObject && mediaObject.fileName) {
          fileName = mediaObject.fileName;
        } else {
          fileName = `media_${Date.now()}`;
        }
      }

      const mimetype = mediaObject.mimetype || "";
      let ext = "";
      if (mediaType === "imageMessage") {
        ext = mimetype.includes("png") ? "png" : "jpg";
      } else if (mediaType === "videoMessage") {
        ext = "mp4";
      } else if (mediaType === "audioMessage") {
        ext = mimetype.includes("opus") ? "opus" : "mp3";
      } else if (mediaType === "stickerMessage") {
        ext = "webp";
      } else if (mediaType === "documentMessage") {
        const docName = ("fileName" in mediaObject && mediaObject.fileName) || "";
        const parts = docName.split(".");
        if (parts.length > 1) {
          ext = "";
        } else {
          ext = mimetype.split("/")[1]?.split(";")[0] || "bin";
        }
      }

      if (ext && !/\.[a-zA-Z0-9]+$/.test(fileName)) {
        fileName = `${fileName}.${ext}`;
      }

      fileName = fileName.replace(/[/\\?%*:|"<>]/g, "-");

      const devDir = join(process.cwd(), "dev");
      await mkdir(devDir, { recursive: true });

      const filePath = join(devDir, fileName);
      await writeFile(filePath, buffer);

      const formatSize = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

      await msg.reply(
        `✅ Media saved successfully.

📁 *Filename:* ${fileName}
⚖️ *Size:* ${formatSize(buffer.length)}`,
      );
    } catch (error: unknown) {
      const err = error as Error;
      await msg.reply(`🚩 Failed to save media: ${err.message || String(error)}`);
    }
  },
});
