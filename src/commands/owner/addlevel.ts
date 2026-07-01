import { defineCommand } from "@/core/types";
import { addLevel } from "@/infra/database";
import { getNumber } from "@/utils/helper";

export default defineCommand({
  name: "AddLevel",
  alias: ["addlevel"],
  description: "Add user level (Owner Only)",
  ownerOnly: true,
  handler: async (_sock, msg) => {
    const target = msg.quoted?.sender || msg.mentioned[0];
    const amount = Number.parseInt(msg.args[1] || msg.args[0] || "0", 10);

    if (!target || Number.isNaN(amount)) {
      return msg.reply("Format: .addlevel @user <amount>");
    }

    addLevel(target, amount);
    await msg.reply(`✅ Successfully added *${String(amount)}* levels for @${getNumber(target)}`);
  },
});
