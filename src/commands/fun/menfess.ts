import { config } from "@/core/config";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "menfess",
  description: "Kirim pesan rahasia ke nomor WA via bot (anonim). Gunakan di private chat.",
  handler: async (sock, msg) => {
    if (msg.isGroup)
      return msg.reply("❌ Kirim perintah ini di private chat bot.\nFormat: .menfess 628xxx Pesan");

    const target = msg.args[0];
    const message = msg.args.slice(1).join(" ");

    if (!target || !message)
      return msg.reply(
        "Format: .menfess <nomor> <pesan>\nContoh: .menfess 6281234567890 Kamu cantik banget hari ini",
      );

    const targetJid = `${target.replace(/[^0-9]/g, "")}@s.whatsapp.net`;

    const result = await sock.onWhatsApp(target.replace(/[^0-9]/g, ""));
    if (!result?.[0]?.exists) return msg.reply("❌ Nomor tidak terdaftar di WhatsApp.");

    await sock.sendMessage(targetJid, {
      text: `💌 *Menfess*\n\n"${message}"\n\n_Seseorang mengirim pesan rahasia untukmu melalui ${config.name}._\n_Balas dengan: ${config.prefix}menfessreply <pesan>_`,
    });

    await msg.reply("✅ Menfess terkirim! Identitasmu tetap rahasia.");
  },
});
