import { config } from "@/core/config";
import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "report",
  description: "Laporkan bug/saran ke owner. Contoh: .report bot error di command sticker",
  handler: async (sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply("Format: .report <pesan laporan>");
    const ownerJid = `${config.owner[0]}@s.whatsapp.net`;
    await sock.sendMessage(ownerJid, {
      text: `📮 *Report dari User*\n\n👤 @${getNumber(msg.sender)}\n💬 ${text}\n📍 ${msg.isGroup ? msg.jid : "Private Chat"}`,
      mentions: [msg.sender],
    });
    await msg.reply("✅ Laporan terkirim ke owner. Terima kasih!");
  },
});
