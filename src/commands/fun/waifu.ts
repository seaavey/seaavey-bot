import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "waifu",
  description: "Random gambar anime waifu",
  handler: async (_sock, msg) => {
    const res = await fetch("https://api.waifu.pics/sfw/waifu");
    const data = (await res.json()) as { url?: string };
    if (!data.url) return msg.reply("❌ Gagal mengambil gambar.");
    await msg.send({ image: { url: data.url }, caption: "🌸 Random Waifu" });
  },
});
