import { defineCommand } from "@/core/types";
import { geniusSearch } from "@/infra/scrapers";

export default defineCommand({
  name: "Lirik",
  alias: ["lirik"],
  description: "Search song lyrics. Example: .lirik Bohemian Rhapsody",
  handler: async (_sock, msg) => {
    const query = msg.args.join(" ");
    if (!query) return msg.reply("Format: .lirik <judul lagu>");
    await msg.reply("⏳ Searching lyrics...");
    const res = await geniusSearch(query, 5);
    if (!res.status) return msg.reply(`🚩 ${res.error}`);
    const list = res.data
      .map(
        (s, i) =>
          `${i + 1}. *${s.title}* — ${s.artist}${s.album ? ` (${s.album}${s.year ? `, ${s.year}` : ""})` : ""}`,
      )
      .join("\n");
    await msg.reply(`🎵 *Lyrics Search Results*

${list}`);
  },
});
