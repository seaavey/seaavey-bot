import { config } from "@/core/config";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "confess",
  description: "Kirim pesan anonim ke seseorang. Gunakan di private chat.",
  handler: async (sock, msg) => {
    if (msg.isGroup)
      return msg.reply(
        "❌ Kirim perintah ini di private chat bot.\nFormat: .confess 628xxx Pesan kamu",
      );
    const target = msg.args[0];
    const message = msg.args.slice(1).join(" ");
    if (!target || !message)
      return msg.reply(
        "Format: .confess <nomor> <pesan>\nContoh: .confess 6281234567890 Hai, aku suka kamu",
      );
    const targetJid = `${target.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
    await sock.sendMessage(targetJid, {
      text: `💌 *Pesan Anonim*\n\n${message}\n\n_Balas dengan: ${config.prefix}confessreply <pesan>_`,
    });
    await msg.reply("✅ Pesan anonim terkirim!");
  },
});
