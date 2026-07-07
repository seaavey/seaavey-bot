import { defineCommand } from "@/core/types";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export default defineCommand({
  name: "Save Media",
  alias: ["savemedia", "svmedia"],
  description:
    "Save media (image, video, audio, sticker, document) from message or reply to /dev folder on server",
  usage: "{prefix}savemedia [nama_file]",
  tags: ["media"],
  ownerOnly: true,
  handler: async (sock, msg) => {
    const media = msg.findMedia(
      "imageMessage",
      "videoMessage",
      "audioMessage",
      "stickerMessage",
      "documentMessage",
    );

    if (!media) {
      return msg.reply("🚩 Reply/send media with caption .savemedia");
    }

    await msg.reply("⏳ Downloading media...");

    try {
      const mediaType = media.type;
      const mediaObject = media.message;
      const buffer = await media.download();

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
