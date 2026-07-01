import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";

export default defineCommand({
  name: "Add",
  alias: ["add"],
  description: "Add member to group",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    const number = msg.args[0]?.replace(/[^0-9]/g, "");
    if (!number) return msg.reply("Enter the number! Example: !add 6281234567890");
    const target = `${number}@s.whatsapp.net`;

    await sock.groupParticipantsUpdate(msg.jid, [target], "add");
    await msg.send({
      text: `✅ @${getNumber(target)} added to group!`,
      mentions: [target],
    });
  },
});
