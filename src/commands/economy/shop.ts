import { addWallet, getEconomy } from "@/infra/database";
import { defineCommand } from "@/core/types";

const SHOP_ITEMS = [
  { id: "1", name: "🎣 Fishing Rod", price: 5000, desc: "Alat pancing" },
  { id: "2", name: "⛏️ Pickaxe", price: 8000, desc: "Alat tambang" },
  { id: "3", name: "🗡️ Sword", price: 12000, desc: "Senjata duel" },
];

export default defineCommand({
  name: "shop",
  description: "Lihat toko item",
  handler: async (_sock, msg) => {
    const buyId = msg.args[0];
    if (!buyId) {
      const list = SHOP_ITEMS.map(
        (i) => `${i.id}. ${i.name} — ${i.price.toLocaleString()} coins\n   _${i.desc}_`,
      ).join("\n\n");
      return msg.reply(`🛒 *Shop*\n\n${list}\n\nBeli: .shop <nomor>`);
    }
    const item = SHOP_ITEMS.find((i) => i.id === buyId);
    if (!item) return msg.reply("❌ Item tidak ditemukan.");
    const eco = getEconomy(msg.sender);
    if (eco.wallet < item.price)
      return msg.reply(`❌ Saldo tidak cukup. Butuh ${item.price.toLocaleString()} coins.`);
    addWallet(msg.sender, -item.price);
    await msg.reply(`✅ Berhasil membeli ${item.name}!`);
  },
});
