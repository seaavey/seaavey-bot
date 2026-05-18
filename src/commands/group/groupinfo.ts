import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "groupinfo",
  description: "Lihat info grup",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    const metadata = await sock.groupMetadata(msg.jid);
    const admins = metadata.participants.filter((p) => p.admin);
    const text = [
      `*${metadata.subject}*`,
      `ID: ${metadata.id}`,
      `Dibuat: ${new Date((metadata.creation || 0) * 1000).toLocaleDateString("id-ID")}`,
      `Member: ${metadata.participants.length}`,
      `Admin: ${admins.length}`,
      `Deskripsi: ${metadata.desc || "-"}`,
    ].join("\n");
    await msg.reply(text);
  },
});
