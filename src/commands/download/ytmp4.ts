import { defineCommand } from "@/core/types";
import { ytmp4 } from "@/infra/scrapers";

export default defineCommand({
  name: "YT MP4",
  alias: ["ytmp4"],
  description: "Download video from YouTube",
  cooldown: 60,
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply("Format: .ytmp4 <url>");

    await msg.reply("⏳ Downloading video...");

    const result = await ytmp4(url);

    if (!result.status) {
      return msg.reply(`🚩 Failed: ${result.error || "Media not found"}`);
    }

    const { title, thumbnail, downloadUrl, format } = result.data;

    const caption = [`🎬 *${title}*`, format ? `📦 ${format}` : null].filter(Boolean).join("\n");

    if (thumbnail) {
      await msg.send({ image: { url: thumbnail }, caption });
    } else {
      await msg.reply(caption);
    }

    if (downloadUrl) {
      await msg.send({ video: { url: downloadUrl }, caption: "" });
    }
  },
});
