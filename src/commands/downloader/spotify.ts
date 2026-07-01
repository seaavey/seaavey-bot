import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { spotify, spotifySearch } from "@/infra/scrapers";

export default defineCommand({
  name: "Spotify",
  alias: ["spot", "spotify"],
  description: t("downloader.spotify.desc"),
  handler: async (_sock, msg) => {
    const input = msg.args.join(" ");
    if (!input) {
      return msg.reply(t("downloader.spotify.format"));
    }

    const isUrl = input.includes("open.spotify.com");

    if (isUrl) {
      await msg.reply(t("downloader.spotify.fetching"));

      const result = await spotify(input);

      if (!result.status) {
        return msg.reply(t("downloader.spotify.failed", { error: result.error }));
      }

      const { title, artist, album, duration, cover, downloadUrl } = result.data;

      const caption = [
        `🎵 *${title}*`,
        `🎤 ${artist}`,
        album ? `💿 ${album}` : null,
        `⏱️ ${duration}`,
      ]
        .filter(Boolean)
        .join("\n");

      if (cover) {
        await msg.send({ image: { url: cover }, caption });
      } else {
        await msg.reply(caption);
      }

      if (downloadUrl) {
        await msg.send({ audio: { url: downloadUrl }, mimetype: "audio/mpeg" });
      }
    } else {
      await msg.reply(t("downloader.spotify.searching"));

      const result = await spotifySearch(input, 5);

      if (!result.status) {
        return msg.reply(t("downloader.spotify.searchFailed", { error: result.error }));
      }

      if (result.data.tracks.length === 0) {
        return msg.reply(t("downloader.spotify.notFound"));
      }

      const tracks = result.data.tracks
        .map((t, i) => `${i + 1}. 🎵 *${t.title}*\n   🎤 ${t.artist} • ⏱️ ${t.duration}`)
        .join("\n\n");

      await msg.reply(
        t("downloader.spotify.searchResult", {
          query: result.data.query,
          tracks,
          max: String(result.data.tracks.length),
        }),
      );
    }
  },
});
