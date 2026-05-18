import { addWallet, getEconomy, setLastDaily } from "@/infra/database";
import { getRandomNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";
export default defineCommand({
  name: "daily",
  description: "Klaim hadiah harian",
  handler: async (_sock, msg) => {
    const eco = getEconomy(msg.sender);
    const now = Date.now();
    const oneDay = 86400000;
    if (now - eco.lastDaily < oneDay) {
      const remaining = oneDay - (now - eco.lastDaily);
      const hours = Math.floor(remaining / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      return msg.reply(`⏰ Kamu sudah klaim hari ini. Coba lagi dalam ${hours}j ${mins}m.`);
    }
    const reward = getRandomNumber(3000, 7999);
    addWallet(msg.sender, reward);
    setLastDaily(msg.sender);
    await msg.reply(
      `🎁 Daily reward: +${reward.toLocaleString()} coins!\n💰 Wallet: ${(eco.wallet + reward).toLocaleString()}`,
    );
  },
});
