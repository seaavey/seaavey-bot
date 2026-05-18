import { api } from "@/infra/api";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "ssweb",
  description: "Screenshot website. Contoh: .ssweb https://google.com",
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    const mode = msg.args[1] || "desktop";
    if (!url)
      return msg.reply("Format: .ssweb <url> [desktop|mobile]\nContoh: .ssweb https://google.com");
    await msg.reply("📸 Capturing...");
    const res = await api.get<{ url: string }>(
      `/tools/ssweb?url=${encodeURIComponent(url)}&mode=${mode}`,
    );
    await msg.send({ image: { url: res.data.url }, caption: `🌐 ${url}` });
  },
});
