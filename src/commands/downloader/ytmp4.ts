import { api } from "@/infra/api";
import { defineCommand } from "@/core/types";

interface YTData {
  title: string;
  url: string;
}

export default defineCommand({
  name: "ytmp4",
  description: "Download video dari YouTube",
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply("Kirim URL YouTube.\nContoh: .ytmp4 https://youtu.be/...");
    await msg.reply("⏳ Downloading video...");
    const res = await api.get<YTData>(`/downloader/youtube/video?url=${encodeURIComponent(url)}`);
    await msg.send({ video: { url: res.data.url }, caption: res.data.title });
  },
});
