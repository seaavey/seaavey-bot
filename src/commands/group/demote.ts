import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "demote",
  description: "Hapus admin dari member",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    if (!msg.isAdmin) return msg.reply("Kamu bukan admin!");
    if (!msg.isBotAdmin) return msg.reply("Bot bukan admin!");
    const target = msg.mentioned[0] || msg.quoted;
    if (!target) return msg.reply("Tag atau reply user yang mau di demote!");
    await sock.groupParticipantsUpdate(msg.jid, [target], "demote");
    await msg.send({
      text: `Done, @${getNumber(target)} telah dicopot dari admin!`,
      mentions: [target],
    });
  },
});
