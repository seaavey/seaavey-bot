import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";

export default defineCommand({
  name: "Demote",
  alias: ["dmt", "demote"],
  description: "Demote admin to regular member",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender;
    if (!target) return msg.reply("Tag or reply to the user you want to demote!");

    await sock.groupParticipantsUpdate(msg.jid, [target], "demote");
    await msg.send({
      text: `Done, @${getNumber(target)} has been demoted from admin!`,
      mentions: [target],
    });
  },
});
