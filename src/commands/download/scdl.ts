import { defineCommand } from "@/core/types";
import { soundcloudDl } from "@/infra/scrapers";

export default defineCommand({
  name: "SoundCloud DL",
  alias: ["scdl", "soundclouddl"],
  description: "Download songs from SoundCloud",
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply("Format: .scdl <url>");

    await msg.reply("⏳ Downloading...");

    const result = await soundcloudDl(url);

    if (!result.status) {
      return msg.reply(`🚩 Failed: ${result.error || "Media not found"}`);
    }

    const { title, artist, duration, artwork, streamUrl } = result.data;

    const caption = [`🎵 *${title}*`, `🎤 ${artist}`, `⏱️ ${duration}`].filter(Boolean).join("\n");

    if (artwork) {
      await msg.send({ image: { url: artwork }, caption });
    } else {
      await msg.reply(caption);
    }

    if (streamUrl) {
      await msg.send({ audio: { url: streamUrl }, mimetype: "audio/mpeg" });
    }
  },
});
