import { api } from "@/infra/api";
import { defineCommand } from "@/core/types";

interface PinResult {
  title: string;
  url: string;
  image: string;
}

export default defineCommand({
  name: "pinterest",
  description: "Cari gambar di Pinterest. Contoh: .pinterest anime wallpaper",
  handler: async (_sock, msg) => {
    const query = msg.args.join(" ");
    if (!query) return msg.reply("Format: .pinterest <kata kunci>");
    await msg.reply("🔍 Mencari...");
    const res = await api.get<PinResult[]>(
      `/search/pinterest?query=${encodeURIComponent(query)}&limit=5`,
    );
    if (!res.data.length) return msg.reply("❌ Tidak ditemukan.");
    for (const pin of res.data.slice(0, 5)) {
      await msg.send({ image: { url: pin.image }, caption: pin.title || "" });
    }
  },
});
