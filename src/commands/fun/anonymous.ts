import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "anonymous",
  description: "Kirim pesan anonim ke member grup. Format: .anonymous @tag pesan",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya bisa digunakan di group.");

    const mentioned = msg.mentioned[0];
    const text = msg.args.slice(1).join(" ");

    if (!mentioned || !text) {
      return msg.reply(
        "Format: .anonymous @tag pesan\nContoh: .anonymous @6281xxx Hai kamu keren!",
      );
    }

    if (mentioned === msg.sender) return msg.reply("❌ Tidak bisa kirim ke diri sendiri.");

    await sock.sendMessage(msg.jid, {
      text: `💬 *Pesan Anonim*\n\n"${text}"\n\n_Seseorang di grup ini mengirim pesan anonim untukmu._`,
      mentions: [mentioned],
    });

    await msg.reply("✅ Pesan anonim terkirim ke grup!");
  },
});
