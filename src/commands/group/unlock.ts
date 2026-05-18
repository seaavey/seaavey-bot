import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "unlock",
  description: "Buka setting grup (semua member bisa edit info)",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    if (!msg.isAdmin) return msg.reply("Kamu bukan admin!");
    if (!msg.isBotAdmin) return msg.reply("Bot bukan admin!");
    await sock.groupSettingUpdate(msg.jid, "unlocked");
    await msg.reply("Setting grup dibuka, semua member bisa edit info.");
  },
});
