import { config } from "@/core/config";
import { defineCommand } from "@/core/types";
import { imageToSticker, videoToSticker } from "@/utils/convert";

export default defineCommand({
  name: "Sticker",
  alias: ["stiker", "sticker", "s"],
  description: "Convert image/video to sticker",
  handler: async (sock, msg) => {
    const media = msg.findMedia("imageMessage", "videoMessage");

    if (!media) {
      return msg.reply("Send/reply to an image or video (max 10s) with caption .sticker");
    }

    const buffer = await media.download();

    const pack = msg.args[0] || config.name;
    const author = msg.args[1] || "Seaavey";

    const sticker =
      media.type === "videoMessage"
        ? await videoToSticker(buffer, { pack, author })
        : await imageToSticker(buffer, { pack, author });

    await msg.send({ sticker });
  },
});
