import { defineCommand } from "@/core/types";

const pending = new Set<string>();

export default defineCommand({
  name: "kickall",
  description: "Kick semua member kecuali admin (dengan konfirmasi)",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    if (!msg.isAdmin) return msg.reply("Kamu bukan admin!");
    if (!msg.isBotAdmin) return msg.reply("Bot bukan admin!");

    const key = `${msg.jid}:${msg.sender}`;

    if (!pending.has(key)) {
      pending.add(key);
      setTimeout(() => pending.delete(key), 30000);
      return msg.reply(
        "⚠️ *PERINGATAN*\nIni akan mengeluarkan SEMUA member kecuali admin.\n\nKetik *.kickall* lagi dalam 30 detik untuk konfirmasi.",
      );
    }

    pending.delete(key);

    const metadata = await sock.groupMetadata(msg.jid);
    const members = metadata.participants.filter((p) => !p.admin).map((p) => p.id);

    if (!members.length) return msg.reply("Tidak ada member yang bisa di kick!");

    await msg.reply(`Mengeluarkan ${members.length} member...`);

    for (const member of members) {
      await sock.groupParticipantsUpdate(msg.jid, [member], "remove");
    }

    await msg.reply(`Done! ${members.length} member telah dikeluarkan.`);
  },
});
