import { api } from "@/infra/api";
import { defineCommand } from "@/core/types";

interface YTData {
  title: string;
  url: string;
}

export default defineCommand({
  name: "ytmp3",
  description: "Download audio dari YouTube",
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply("Kirim URL YouTube.\nContoh: .ytmp3 https://youtu.be/...");
    await msg.reply("⏳ Downloading audio...");
    const res = await api.get<YTData>(`/downloader/youtube/audio?url=${encodeURIComponent(url)}`);
    await msg.send({ audio: { url: res.data.url }, mimetype: "audio/mpeg" });
  },
});
