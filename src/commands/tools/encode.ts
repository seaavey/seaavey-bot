import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "encode",
  description: "Encode teks ke Base64",
  handler: async (_sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply("Format: .encode <teks>");
    await msg.reply(`🔐 *Base64 Encode:*\n\n${Buffer.from(text).toString("base64")}`);
  },
});
