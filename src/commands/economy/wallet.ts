import { getEconomy } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "wallet",
  description: "Cek saldo kamu",
  handler: async (_sock, msg) => {
    const eco = getEconomy(msg.sender);
    await msg.reply(
      `💰 *Wallet*\n\n🪙 Cash: ${eco.wallet.toLocaleString()}\n🏦 Bank: ${eco.bank.toLocaleString()}\n📊 Total: ${(eco.wallet + eco.bank).toLocaleString()}`,
    );
  },
});
