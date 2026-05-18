import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "join",
  description: "Join group via invite link (owner only)",
  handler: async (sock, msg) => {
    if (!msg.isOwner) return;

    const link = msg.args[0];
    if (!link)
      return msg.reply("Masukkan link group.\nContoh: .join https://chat.whatsapp.com/xxx");

    const code = link.replace("https://chat.whatsapp.com/", "");
    try {
      await sock.groupAcceptInvite(code);
      await msg.reply("✅ Berhasil join group.");
    } catch {
      await msg.reply("❌ Gagal join group. Link tidak valid atau sudah expired.");
    }
  },
});
