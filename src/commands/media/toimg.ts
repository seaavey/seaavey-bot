import { downloadMediaMessage, type WAMessage } from "baileys";
import { defineCommand } from "@/core/types";
import { stickerToImage } from "@/utils/convert";

export default defineCommand({
  name: "To Image",
  alias: ["toimage"],
  description: "Convert sticker to image",
  handler: async (sock, msg) => {
    const sticker = msg.quoted?.stickerMessage;

    if (!sticker) {
      return msg.reply("Reply to a sticker with caption .toimg");
    }

    if (sticker.mimetype && sticker.mimetype !== "image/webp") {
      return msg.reply("Only WebP stickers (image/webp) are supported.");
    }

    if (!sticker.url && !sticker.directPath) {
      return msg.reply("Sticker doesn't have a valid media path.");
    }

    if (sticker.fileLength && Number(sticker.fileLength) === 0) {
      return msg.reply("Sticker is empty or corrupt.");
    }

    if (sticker.isAnimated) {
      return msg.reply("Animated stickers can't be converted to an image.");
    }

    await msg.reply("⏳ Converting sticker to image...");

    const message = {
      key: { ...msg.key, id: msg.quoted?.id, participant: msg.quoted?.sender },
      message: { stickerMessage: sticker },
    } as WAMessage;

    const buffer = (await downloadMediaMessage(message, "buffer", {
      host: "mmg.whatsapp.net",
    })) as Buffer;
    const image = stickerToImage(buffer);

    await msg.send({ image });
  },
});
