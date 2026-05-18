import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "setname",
  description: "Ubah nama grup",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    if (!msg.isAdmin) return msg.reply("Kamu bukan admin!");
    if (!msg.isBotAdmin) return msg.reply("Bot bukan admin!");
    const name = msg.args.join(" ");
    if (!name) return msg.reply("Masukkan nama baru! Contoh: !setname Grup Keren");
    await sock.groupUpdateSubject(msg.jid, name);
    await msg.reply(`Nama grup diubah ke: ${name}`);
  },
});
