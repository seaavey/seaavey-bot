import { defineCommand } from "@/core/types";
import { addWarn, ensureGroup, getWarns } from "@/infra/database";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "Warn",
  alias: ["warn"],
  description: "Warn a member",
  groupOnly: true,
  adminOnly: true,
  handler: async (sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender;
    if (!target) return msg.reply("Tag or reply to the user you want to warn.");
    const reason = msg.args.filter((a: string) => !a.startsWith("@")).join(" ") || "No reason";
    addWarn(msg.jid, target, reason);
    const warns = getWarns(msg.jid, target);
    const group = ensureGroup(msg.jid);
    const max = group.warnMax || 3;
    if (warns.length >= max) {
      await sock.groupParticipantsUpdate(msg.jid, [target], "remove");
      await msg.reply(`⚠️ @${getNumber(target)} has reached ${max} warns and has been kicked!`);
    } else {
      await msg.reply(
        `⚠️ @${getNumber(target)} warned! (${warns.length}/${max})
Reason: ${reason}`,
      );
    }
  },
});
