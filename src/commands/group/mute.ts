import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "mute",
  description: "Tutup grup (hanya admin yang bisa chat)",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    if (!msg.isAdmin) return msg.reply("Kamu bukan admin!");
    if (!msg.isBotAdmin) return msg.reply("Bot bukan admin!");
    await sock.groupSettingUpdate(msg.jid, "announcement");
    await msg.reply("Grup telah ditutup, hanya admin yang bisa chat.");
  },
});
