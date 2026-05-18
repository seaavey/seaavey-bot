import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "promote",
  description: "Jadikan member sebagai admin",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    if (!msg.isAdmin) return msg.reply("Kamu bukan admin!");
    if (!msg.isBotAdmin) return msg.reply("Bot bukan admin!");
    const target = msg.mentioned[0] || msg.quoted;
    if (!target) return msg.reply("Tag atau reply user yang mau di promote!");
    await sock.groupParticipantsUpdate(msg.jid, [target], "promote");
    await msg.send({
      text: `Done, @${getNumber(target)} telah dijadikan admin!`,
      mentions: [target],
    });
  },
});
