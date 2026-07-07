import { defineCommand } from "@/core/types";
import { upscaleImage } from "@/infra/scrapers";

export default defineCommand({
  name: "Upscale",
  alias: ["upscale", "hd"],
  description: "Upscale image 2x or 4x using iLoveIMG",
  usage: "{prefix}upscale [2|4]",
  tags: ["media"],
  handler: async (sock, msg) => {
    const media = msg.findMedia("imageMessage");

    if (!media) return msg.reply("🚩 Reply or send an image with caption .upscale [2|4]");

    const scale = parseInt(msg.args[0] || "4") as 2 | 4;
    if (![2, 4].includes(scale)) return msg.reply("🚩 Scale must be 2 or 4");

    await msg.reply(`⏳ Upscaling ${String(scale)}x...`);

    try {
      const buffer = await media.download();

      const result = await upscaleImage(Buffer.from(buffer), scale);
      if (!result.status) return msg.reply(`🚩 ${result.error}`);

      await msg.send({
        image: result.data.buffer,
        caption: `✅ ${String(result.data.scale)}x upscale successful!`,
      });
    } catch (e: unknown) {
      const error = e as Error;
      await msg.reply(`🚩 Failed: ${error.message}`);
    }
  },
});
