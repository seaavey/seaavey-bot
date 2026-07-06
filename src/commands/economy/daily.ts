import { defineCommand } from "@/core/types";
import { creditWallet, getEconomy, setLastDaily } from "@/infra/database";
import { getRandomNumber } from "@/utils/helper";

export default defineCommand({
  name: "Daily",
  alias: ["daily"],
  description: "Claim your daily reward",
  handler: async (_sock, msg) => {
    const eco = getEconomy(msg.sender);
    const now = Date.now();
    const oneDay = 86400000;
    if (now - eco.lastDaily < oneDay) {
      const remaining = oneDay - (now - eco.lastDaily);
      const hours = Math.floor(remaining / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      return msg.reply(`⏰ You already claimed today. Try again in ${hours}h ${mins}m.`);
    }
    const reward = getRandomNumber(3000, 7999);
    creditWallet(msg.sender, reward);
    setLastDaily(msg.sender);
    await msg.reply(
      `🎁 Daily reward: +${reward.toLocaleString()} coins!\n💰 Wallet: ${(eco.wallet + reward).toLocaleString()}`,
    );
  },
});
