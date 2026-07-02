import { downloadMediaMessage, type WAMessage } from "baileys";
import { defineCommand } from "@/core/types";
import { config } from "@/core/config";
import { stickerToImage, stickerToVideo } from "@/utils/convert";

export default defineCommand({
  name: "To MP4 / Image",
  alias: ["tomp4", "tovid", "tovideo", "stickertoimg", "stickertovideo"],
  description: "Convert sticker to MP4 video or static image locally",
  usage: "{prefix}tomp4",
  tags: ["converter"],
  handler: async (sock, msg) => {
    const sticker = msg.message?.stickerMessage || msg.quoted?.stickerMessage;

    if (!sticker) {
      return msg.reply("🚩 Reply to or send a sticker with caption .tomp4");
    }

    if (sticker.mimetype && sticker.mimetype !== "image/webp") {
      return msg.reply("🚩 Only WebP stickers (image/webp) are supported.");
    }

    if (!sticker.url && !sticker.directPath) {
      return msg.reply("🚩 Sticker does not have a valid media path.");
    }

    if (sticker.fileLength && Number(sticker.fileLength) === 0) {
      return msg.reply("🚩 Sticker is empty or corrupted.");
    }

    // Parse the actual trigger invoked by the user
    const body = msg.body || "";
    const prefix = config.prefix.find((p) => body.startsWith(p)) || "";
    const trigger = (body.slice(prefix.length).split(" ")[0] || "").toLowerCase();

    const mediaMsg = msg.quoted
      ? {
          key: { ...msg.key, id: msg.quoted.id, participant: msg.quoted.sender },
          message: { stickerMessage: sticker },
        }
      : msg.raw;

    try {
      // Determine conversion type: static image vs animated video
      const isStaticRequest = trigger === "stickertoimg" || !sticker.isAnimated;

      if (isStaticRequest) {
        await msg.reply("⏳ Converting sticker to image...");
        const buffer = (await downloadMediaMessage(mediaMsg as WAMessage, "buffer", {
          host: "mmg.whatsapp.net",
        })) as Buffer;

        if (!buffer) throw new Error("Failed to download sticker.");
        const image = stickerToImage(buffer);
        await msg.send({ image });
      } else {
        await msg.reply("⏳ Converting animated sticker to video...");
        const buffer = (await downloadMediaMessage(mediaMsg as WAMessage, "buffer", {
          host: "mmg.whatsapp.net",
        })) as Buffer;

        if (!buffer) throw new Error("Failed to download sticker.");
        const video = stickerToVideo(buffer);
        await msg.send({
          video,
          mimetype: "video/mp4",
          caption: "✅ Successfully converted to video",
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      await msg.reply(`🚩 Failed to convert sticker: ${err.message}`);
    }
  },
});
