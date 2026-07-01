import { defineCommand } from "@/core/types";
import { getEconomy } from "@/infra/database";

export default defineCommand({
  name: "Wallet",
  alias: ["bal", "saldo", "wallet"],
  description: "Check your balance",
  handler: async (_sock, msg) => {
    const eco = getEconomy(msg.sender);
    await msg.reply(
      `💰 *Wallet*\n\n🪙 Cash: ${eco.wallet.toLocaleString()}\n🏦 Bank: ${eco.bank.toLocaleString()}\n📊 Total: ${(eco.wallet + eco.bank).toLocaleString()}`,
    );
  },
});
