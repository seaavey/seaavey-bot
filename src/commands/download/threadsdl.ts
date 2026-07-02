import { defineCommand } from "@/core/types";
import { threadsDl } from "@/infra/scrapers";

export default defineCommand({
  name: "Threads DL",
  alias: ["tdl", "threadsdl"],
  description: "Download media from Threads",
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply("Format: .threadsdl <url>");

    await msg.reply("⏳ Downloading...");

    const result = await threadsDl(url);

    if (!result.status) {
      return msg.reply(`🚩 Failed: ${result.error || "Media not found"}`);
    }

    for (const media of result.data) {
      const isVideo = media.type === "video";
      await msg.send(isVideo ? { video: { url: media.url } } : { image: { url: media.url } });
    }
  },
});
