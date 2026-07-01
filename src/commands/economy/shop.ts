import { defineCommand } from "@/core/types";
import { addWallet, getEconomy } from "@/infra/database";

const SHOP_ITEMS = [
  { id: "1", name: "🎣 Fishing Rod", price: 5000, desc: "Fishing tool" },
  { id: "2", name: "⛏️ Pickaxe", price: 8000, desc: "Mining tool" },
  { id: "3", name: "🗡️ Sword", price: 12000, desc: "Duel weapon" },
];

export default defineCommand({
  name: "Shop",
  alias: ["shop"],
  description: "Browse the item shop",
  handler: async (_sock, msg) => {
    const buyId = msg.args[0];
    if (!buyId) {
      const list = SHOP_ITEMS.map(
        (i) => `${i.id}. ${i.name} — ${i.price.toLocaleString()} coins\n   _${i.desc}_`,
      ).join("\n\n");
      return msg.reply(`🛒 *Shop*\n\n${list}\n\nBuy: .shop <number>`);
    }
    const item = SHOP_ITEMS.find((i) => i.id === buyId);
    if (!item) return msg.reply("🚩 Item not found.");
    const eco = getEconomy(msg.sender);
    if (eco.wallet < item.price)
      return msg.reply(`🚩 Not enough balance. You need ${item.price.toLocaleString()} coins.`);
    addWallet(msg.sender, -item.price);
    await msg.reply(`✅ Successfully bought ${item.name}!`);
  },
});
