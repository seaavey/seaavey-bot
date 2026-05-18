import { api } from "@/infra/api";
import { defineCommand } from "@/core/types";

interface GeniusResult {
  title: string;
  artist: string;
  url: string;
}

export default defineCommand({
  name: "lirik",
  description: "Cari lirik lagu. Contoh: .lirik Bohemian Rhapsody",
  handler: async (_sock, msg) => {
    const query = msg.args.join(" ");
    if (!query) return msg.reply("Format: .lirik <judul lagu>\nContoh: .lirik Bohemian Rhapsody");
    const res = await api.get<GeniusResult[]>(`/search/genius?query=${encodeURIComponent(query)}`);
    if (!res.data.length) return msg.reply("❌ Lagu tidak ditemukan.");
    const list = res.data
      .slice(0, 5)
      .map((s, i) => `${i + 1}. *${s.title}* — ${s.artist}`)
      .join("\n");
    await msg.reply(`🎵 *Hasil Pencarian*\n\n${list}`);
  },
});
