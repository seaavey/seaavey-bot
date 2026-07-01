import { defineCommand } from "@/core/types";
import { getWarns } from "@/infra/database";
import { getNumber } from "@/utils/helper";

export default defineCommand({
  name: "Warn List",
  alias: ["wl", "warns", "warnlist"],
  description: "View member warn list",
  groupOnly: true,
  handler: async (_sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender || msg.sender;
    const warns = getWarns(msg.jid, target);

    if (!warns.length) return msg.reply(`✅ @${getNumber(target)} has no warns.`);

    const list = warns
      .map((w, i) => `${i + 1}. ${w.reason} (${new Date(w.timestamp).toLocaleDateString("id")})`)
      .join("\n");

    await msg.reply(
      `⚠️ *Warn List @${getNumber(target)}*
${list}`,
    );
  },
});
