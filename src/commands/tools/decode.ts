import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "decode",
  description: "Decode Base64 ke teks",
  handler: async (_sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply("Format: .decode <base64>");
    try {
      await msg.reply(`🔓 *Base64 Decode:*\n\n${Buffer.from(text, "base64").toString("utf-8")}`);
    } catch {
      await msg.reply("❌ Input bukan Base64 yang valid.");
    }
  },
});
