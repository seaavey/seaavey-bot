import { defineCommand } from "@/core/types";
import { setXp } from "@/infra/database";
import { getNumber } from "@/utils/helper";

export default defineCommand({
  name: "SetXP",
  alias: ["setxp"],
  description: "Set user XP (Owner Only)",
  ownerOnly: true,
  handler: async (_sock, msg) => {
    const target = msg.quoted?.sender || msg.mentioned[0];
    const xp = Number.parseInt(msg.args[1] || msg.args[0] || "0", 10);

    if (!target || Number.isNaN(xp)) {
      return msg.reply("Format: .setxp @user <xp>");
    }

    setXp(target, xp);
    await msg.reply(`✅ Successfully set @${getNumber(target)}'s XP to *${String(xp)}*`);
  },
});
