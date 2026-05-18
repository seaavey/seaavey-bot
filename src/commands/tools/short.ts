import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "short",
  description: "Perpendek URL. Contoh: .short https://google.com",
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply("Format: .short <url>");
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    const short = await res.text();
    if (!short.startsWith("http")) return msg.reply("❌ URL tidak valid.");
    await msg.reply(`🔗 *Short URL*\n\n${short}`);
  },
});
