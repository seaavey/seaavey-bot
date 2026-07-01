import { config } from "@/core/config";
import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";

export default defineCommand({
  name: "Report",
  alias: ["rpt", "report"],
  description: "Report bug/suggestion to owner. Example: .report sticker command error",
  handler: async (sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply("Format: .report <message>");
    const ownerJid = `${config.owner[0]}@s.whatsapp.net`;
    await sock.sendMessage(ownerJid, {
      text: `📮 *Report from User*

👤 @${getNumber(msg.sender)}
💬 ${text}
📍 ${msg.isGroup ? msg.jid : "Private Chat"}`,
      mentions: [msg.sender],
    });
    await msg.reply("✅ Report sent to owner. Thank you!");
  },
});
