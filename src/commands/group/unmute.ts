import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "unmute",
  description: "Buka grup (semua member bisa chat)",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    if (!msg.isAdmin) return msg.reply("Kamu bukan admin!");
    if (!msg.isBotAdmin) return msg.reply("Bot bukan admin!");
    await sock.groupSettingUpdate(msg.jid, "not_announcement");
    await msg.reply("Grup telah dibuka, semua member bisa chat.");
  },
});
