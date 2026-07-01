import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "Kick",
  alias: ["kick"],
  description: "Kick member from group",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender;
    if (!target) return msg.reply("Tag or reply to the user you want to kick!");
    await sock.groupParticipantsUpdate(msg.jid, [target], "remove");
    await msg.send({
      text: `Done, @${getNumber(target)} kicked!`,
      mentions: [target],
    });
  },
});
