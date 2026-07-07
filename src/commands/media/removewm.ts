import { defineCommand } from "@/core/types";
import { removeWatermark } from "@/infra/scrapers";

export default defineCommand({
  name: "Remove Watermark",
  alias: ["removewm", "removewatermark", "unwm"],
  description: "Remove watermark from an image using EzRemove",
  tags: ["media"],
  handler: async (sock, msg) => {
    const media = msg.findMedia("imageMessage");

    if (!media) {
      return msg.reply("🚩 Reply or send an image with caption .removewm");
    }

    await msg.reply("⏳ Removing watermark...");

    try {
      const buffer = await media.download();

      const result = await removeWatermark(buffer);

      if (!result.status) {
        return msg.reply(`🚩 Failed: ${result.error || "Unknown error"}`);
      }

      await msg.send({ image: result.data.buffer });
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      await msg.reply(`🚩 Failed: ${errMsg}`);
    }
  },
});
