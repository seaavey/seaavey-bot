import { defineCommand } from "@/core/types";
import { getEconomy, transferMoney } from "@/infra/database";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "transfer",
  description: "Transfer uang ke user lain",
  handler: async (_sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted;
    const amount = parseInt(msg.args.find((a) => /^\d+$/.test(a)) || "0", 10);
    if (!target)
      return msg.reply("Tag atau reply user yang ingin ditransfer.\nContoh: .transfer @user 1000");
    if (amount <= 0) return msg.reply("Masukkan jumlah yang valid.");
    if (target === msg.jid) return msg.reply("Tidak bisa transfer ke diri sendiri.");
    const success = transferMoney(msg.jid, target, amount);
    if (!success) return msg.reply("❌ Saldo tidak cukup.");
    const eco = getEconomy(msg.jid);
    await msg.reply(
      `✅ Berhasil transfer ${amount.toLocaleString()} coins ke @${getNumber(target)}\n💰 Sisa saldo: ${eco.wallet.toLocaleString()}`,
    );
  },
});
