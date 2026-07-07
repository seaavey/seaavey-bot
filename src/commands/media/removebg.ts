import { defineCommand } from "@/core/types";
import { removeBackground } from "@/infra/scrapers";

export default defineCommand({
  name: "Remove Background",
  alias: ["removebg", "rbg"],
  description: "Remove image background",
  handler: async (sock, msg) => {
    const media = msg.findMedia("imageMessage");

    if (!media) {
      return msg.reply("Send or reply to an image with caption .removebg");
    }

    await msg.reply("⏳ Removing background...");

    const buffer = await media.download();

    const result = await removeBackground(buffer);

    if (!result.status) {
      return msg.reply(result.error || "Failed to remove background.");
    }

    await msg.send({ image: result.data.buffer });
  },
});
