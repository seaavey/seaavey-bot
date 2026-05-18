import { api } from "@/infra/api";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "pindl",
  description: "Download media dari Pinterest",
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply("Kirim URL Pinterest.\nContoh: .pindl https://pin.it/...");
    await msg.reply("⏳ Downloading...");
    const res = await api.get<{ url: string; type: string }>(
      `/downloader/pinterest?url=${encodeURIComponent(url)}`,
    );
    if (res.data.type === "video") {
      await msg.send({ video: { url: res.data.url } });
    } else {
      await msg.send({ image: { url: res.data.url } });
    }
  },
});
