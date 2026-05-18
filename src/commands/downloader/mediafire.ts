import { api } from "@/infra/api";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "mediafire",
  description: "Download file dari Mediafire",
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url)
      return msg.reply("Kirim URL Mediafire.\nContoh: .mediafire https://mediafire.com/file/...");
    await msg.reply("⏳ Downloading...");
    const res = await api.get<{ filename: string; url: string; size: string }>(
      `/downloader/mediafire?url=${encodeURIComponent(url)}`,
    );
    await msg.send({
      document: { url: res.data.url },
      mimetype: "application/octet-stream",
      fileName: res.data.filename,
    });
  },
});
