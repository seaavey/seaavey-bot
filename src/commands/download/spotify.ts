import { defineCommand } from "@/core/types";
import { spotify, spotifySearch } from "@/infra/scrapers";

export default defineCommand({
  name: "Spotify",
  alias: ["spot", "spotify"],
  description: "Search or download songs from Spotify",
  handler: async (_sock, msg) => {
    const input = msg.args.join(" ");
    if (!input) {
      return msg.reply("Format: .spotify <url or query>");
    }

    const isUrl = input.includes("open.spotify.com");

    if (isUrl) {
      await msg.reply("⏳ Fetching data from Spotify...");

      const result = await spotify(input);

      if (!result.status) {
        return msg.reply(`🚩 Failed: ${result.error}`);
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
      await msg.reply("⏳ Searching on Spotify...");

      const result = await spotifySearch(input, 5);

      if (!result.status) {
        return msg.reply("🚩 Search failed.");
      }

      if (result.data.tracks.length === 0) {
        return msg.reply("🚩 Track not found.");
      }

      const tracks = result.data.tracks
        .map((t, i) => `${i + 1}. 🎵 *${t.title}*\n   🎤 ${t.artist} • ⏱️ ${t.duration}`)
        .join("\n\n");

      await msg.reply(
        `🔍 *Spotify Search Results*

${tracks}

Type number (1-${String(result.data.tracks.length)}) to download.`,
      );
    }
  },
});
