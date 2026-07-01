import { defineCommand } from "@/core/types";
import { getEconomy, transferMoney } from "@/infra/database";
import { getNumber } from "@/utils/helper";

export default defineCommand({
  name: "Transfer",
  alias: ["tf", "transfer"],
  description: "Transfer money to another user",
  handler: async (_sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender;
    const amount = parseInt(msg.args.find((a: string) => /^\d+$/.test(a)) || "0", 10);
    if (!target)
      return msg.reply(
        "Tag or reply to the user you want to transfer to.\nExample: .transfer @user 1000",
      );
    if (amount <= 0) return msg.reply("Enter a valid amount.");
    if (target === msg.jid) return msg.reply("You can't transfer to yourself.");
    const success = transferMoney(msg.jid, target, amount);
    if (!success) return msg.reply("🚩 Not enough balance.");
    const eco = getEconomy(msg.jid);
    await msg.reply(
      `✅ Successfully transferred ${amount.toLocaleString()} coins to @${getNumber(target)}\n💰 Remaining balance: ${eco.wallet.toLocaleString()}`,
    );
  },
});
