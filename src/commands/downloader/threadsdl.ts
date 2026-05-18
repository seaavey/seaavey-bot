import { api } from "@/infra/api";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "threadsdl",
  description: "Download media dari Threads",
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply("Kirim URL Threads.\nContoh: .threadsdl https://threads.net/...");
    await msg.reply("⏳ Downloading...");
    const res = await api.get<{ url: string }>(
      `/downloader/threads?url=${encodeURIComponent(url)}`,
    );
    await msg.send({ video: { url: res.data.url } });
  },
});
