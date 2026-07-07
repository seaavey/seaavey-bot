import { defineCommand } from "@/core/types";
import { stickerToImage } from "@/utils/convert";

export default defineCommand({
  name: "To Image",
  alias: ["toimage"],
  description: "Convert sticker to image",
  handler: async (sock, msg) => {
    const media = msg.findMedia("stickerMessage");

    if (!media) {
      return msg.reply("Reply to a sticker with caption .toimg");
    }

    const sticker = media.message;

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

    const buffer = await media.download();
    const image = stickerToImage(buffer);

    await msg.send({ image });
  },
});
