import { api } from "@/infra/api";
import { defineCommand } from "@/core/types";

interface SCResult {
  title: string;
  url: string;
  duration: number;
}

export default defineCommand({
  name: "soundcloud",
  description: "Cari lagu di SoundCloud. Contoh: .soundcloud lofi beats",
  handler: async (_sock, msg) => {
    const query = msg.args.join(" ");
    if (!query) return msg.reply("Format: .soundcloud <kata kunci>");
    const res = await api.get<SCResult[]>(
      `/search/soundcloud?query=${encodeURIComponent(query)}&limit=5`,
    );
    if (!res.data.length) return msg.reply("❌ Tidak ditemukan.");
    const list = res.data.map((s, i) => `${i + 1}. *${s.title}*\n   🔗 ${s.url}`).join("\n\n");
    await msg.reply(`🎶 *SoundCloud Search*\n\n${list}\n\nDownload: .scdl <url>`);
  },
});
