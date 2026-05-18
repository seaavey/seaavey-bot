import { api } from "@/infra/api";
import { defineCommand } from "@/core/types";

interface TikTokData {
  author: string;
  title: string;
  images?: string[];
  video?: string | null;
  audio?: string | null;
}

export default defineCommand({
  name: "ttdl",
  description: "Download TikTok video/images",
  handler: async (_sock, msg) => {
    const url = msg.body.split(" ").slice(1).join(" ").trim();
    if (!url) return msg.reply("Kirim URL TikTok.\nContoh: !ttdl https://vt.tiktok.com/...");

    await msg.reply("⏳ Downloading...");

    const res = await api.get<TikTokData>(`/downloader/tiktok?url=${encodeURIComponent(url)}`);
    const { data } = res;

    if (data.video) {
      await msg.send({
        video: { url: data.video },
        caption: `${data.title}\n\n👤 ${data.author}`,
      });
    } else if (data.images?.length) {
      for (const image of data.images) {
        await msg.send({ image: { url: image } });
      }
      await msg.reply(`📸 ${data.images.length} images\n\n${data.title}\n👤 ${data.author}`);
    } else {
      await msg.reply("❌ Tidak ada media yang ditemukan.");
    }
  },
});
