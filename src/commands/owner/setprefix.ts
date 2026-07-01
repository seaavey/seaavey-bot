import { config } from "@/core/config";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Set Prefix",
  alias: ["prefix", "setprefix"],
  description: "Change bot prefix (owner only)",
  ownerOnly: true,
  handler: async (_sock, msg) => {
    if (!msg.args[0]) return msg.reply("Format: .setprefix <prefix>");
    const newPrefixes = msg.args[0].split(",");
    config.prefix = newPrefixes;
    await msg.reply(`✅ Prefix changed to: ${config.prefix.join(", ")}`);
  },
});
