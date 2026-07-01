import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";

export default defineCommand({
  name: "Promote",
  alias: ["pmt", "promote"],
  description: "Promote member to admin",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender;
    if (!target) return msg.reply("Tag or reply to the user you want to promote!");

    await sock.groupParticipantsUpdate(msg.jid, [target], "promote");
    await msg.send({
      text: `Done, @${getNumber(target)} has been promoted to admin!`,
      mentions: [target],
    });
  },
});
