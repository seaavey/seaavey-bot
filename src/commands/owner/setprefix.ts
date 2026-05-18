import { config } from "@/core/config";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "setprefix",
  description: "Change bot prefix (owner only)",
  handler: async (_sock, msg) => {
    if (!msg.isOwner) return;
    if (!msg.args[0]) return msg.reply("Contoh: .setprefix !");

    config.prefix = msg.args[0];
    await msg.reply(`✅ Prefix berhasil diubah ke: ${config.prefix}`);
  },
});
