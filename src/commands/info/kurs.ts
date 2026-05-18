import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "kurs",
  description: "Cek kurs mata uang terhadap IDR",
  handler: async (_sock, msg) => {
    const currency = (msg.args[0] || "USD").toUpperCase();
    const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (data.result !== "success" || !data.rates) return msg.reply("❌ Mata uang tidak ditemukan.");
    const idr = data.rates.IDR;
    const usd = data.rates.USD;
    const eur = data.rates.EUR;
    const sgd = data.rates.SGD;
    if (currency === "IDR") {
      await msg.reply(
        `💱 *Kurs IDR*\n\n🇺🇸 1 USD = Rp${(1 / (usd || 1)).toFixed(0)}\n🇪🇺 1 EUR = Rp${(1 / (eur || 1)).toFixed(0)}\n🇸🇬 1 SGD = Rp${(1 / (sgd || 1)).toFixed(0)}`,
      );
    } else {
      await msg.reply(
        `💱 *Kurs ${currency}*\n\n1 ${currency} = Rp${idr?.toLocaleString("id") || "?"}\n1 ${currency} = $${usd?.toFixed(4) || "?"}`,
      );
    }
  },
});
