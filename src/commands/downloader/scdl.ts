import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { soundcloudDl } from "@/infra/scrapers";

export default defineCommand({
  name: "SoundCloud DL",
  alias: ["scdl", "soundclouddl"],
  description: t("downloader.scdl.desc"),
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply(t("downloader.scdl.format"));

    await msg.reply("⏳ Downloading...");

    const result = await soundcloudDl(url);

    if (!result.status) {
      return msg.reply(
        t("downloader.scdl.failed", { error: result.error || t("downloader.scdl.noMedia") }),
      );
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
