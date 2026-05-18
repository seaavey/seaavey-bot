import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "lock",
  description: "Kunci setting grup (hanya admin bisa edit info)",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    if (!msg.isAdmin) return msg.reply("Kamu bukan admin!");
    if (!msg.isBotAdmin) return msg.reply("Bot bukan admin!");
    await sock.groupSettingUpdate(msg.jid, "locked");
    await msg.reply("Setting grup dikunci, hanya admin yang bisa edit info.");
  },
});
