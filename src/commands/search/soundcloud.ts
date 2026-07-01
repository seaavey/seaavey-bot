import { defineCommand } from "@/core/types";
import { soundcloudSearch } from "@/infra/scrapers";

export default defineCommand({
  name: "SoundCloud",
  alias: ["sc", "soundcloud"],
  description: "Search songs on SoundCloud. Example: .soundcloud lofi beats",
  handler: async (_sock, msg) => {
    const query = msg.args.join(" ");
    if (!query) return msg.reply("Format: .soundcloud <query>");

    await msg.reply("⏳ Mencari di SoundCloud...");

    const result = await soundcloudSearch(query, 5);

    if (!result.status) {
      return msg.reply(`🚩 Failed: ${result.error || "🚩 Not found."}`);
    }

    if (result.data.tracks.length === 0) {
      return msg.reply("🚩 Not found.");
    }

    const list = result.data.tracks
      .map((s, i) => `${i + 1}. *${s.title}*\n   🎤 ${s.artist} • ⏱️ ${s.duration}\n   🔗 ${s.url}`)
      .join("\n\n");

    await msg.reply(`🔍 *SoundCloud Search Results*

${list}`);
  },
});
