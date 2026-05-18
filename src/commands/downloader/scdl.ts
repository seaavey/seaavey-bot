import { api } from "@/infra/api";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "scdl",
  description: "Download lagu dari SoundCloud",
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply("Kirim URL SoundCloud.\nContoh: .scdl https://soundcloud.com/...");
    await msg.reply("⏳ Downloading...");
    const res = await api.get<{ title: string; url: string }>(
      `/downloader/soundcloud?url=${encodeURIComponent(url)}`,
    );
    await msg.send({ audio: { url: res.data.url }, mimetype: "audio/mpeg" });
  },
});
