import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Encode",
  alias: ["enc", "encode"],
  description: "Encode text to Base64",
  handler: async (_sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply("Format: .encode <text>");
    await msg.reply(`🔐 *Base64 Encode:*\n\n${Buffer.from(text).toString("base64")}`);
  },
});
