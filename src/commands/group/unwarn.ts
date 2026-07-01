import { defineCommand } from "@/core/types";
import { removeWarns } from "@/infra/database";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "Unwarn",
  alias: ["uw", "unwarn"],
  description: "Remove all member warns",
  groupOnly: true,
  adminOnly: true,
  handler: async (_sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender;
    if (!target) return msg.reply("Tag or reply to the user you want to unwarn.");
    removeWarns(msg.jid, target);
    await msg.reply(`✅ All warns for @${getNumber(target)} have been removed.`);
  },
});
