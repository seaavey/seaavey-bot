import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "setdesc",
  description: "Ubah deskripsi grup",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    if (!msg.isAdmin) return msg.reply("Kamu bukan admin!");
    if (!msg.isBotAdmin) return msg.reply("Bot bukan admin!");
    const desc = msg.args.join(" ");
    if (!desc) return msg.reply("Masukkan deskripsi baru!");
    await sock.groupUpdateDescription(msg.jid, desc);
    await msg.reply("Deskripsi grup telah diubah!");
  },
});
