import { defineCommand } from "@/core/types";
import { setLevel } from "@/infra/database";
import { getNumber } from "@/utils/helper";

export default defineCommand({
  name: "SetLevel",
  alias: ["setlevel"],
  description: "Set user level (Owner Only)",
  ownerOnly: true,
  handler: async (_sock, msg) => {
    const target = msg.quoted?.sender || msg.mentioned[0];
    const level = Number.parseInt(msg.args[1] || msg.args[0] || "0", 10);

    if (!target || Number.isNaN(level)) {
      return msg.reply("Format: .setlevel @user <level>");
    }

    setLevel(target, level);
    await msg.reply(`✅ Successfully set @${getNumber(target)}'s level to *${String(level)}*`);
  },
});
