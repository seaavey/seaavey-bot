import { defineCommand } from "@/core/types";
import { safeFetchJSON } from "@/utils/helper";

export default defineCommand({
  name: "Kurs",
  alias: ["kurs"],
  description: "Check currency exchange rates against IDR",
  handler: async (_sock, msg) => {
    const currency = (msg.args[0] || "USD").toUpperCase();
    const data = await safeFetchJSON<{ result?: string; rates?: Record<string, number> }>(
      `https://open.er-api.com/v6/latest/${currency}`,
    );
    if (!data || data.result !== "success" || !data.rates)
      return msg.reply("🚩 Currency not found.");
    const idr = data.rates.IDR;
    const usd = data.rates.USD;
    const eur = data.rates.EUR;
    const sgd = data.rates.SGD;
    if (currency === "IDR") {
      await msg.reply(
        `💱 *IDR Exchange Rates*

💵 USD: Rp${(1 / (usd || 1)).toFixed(0)}
💶 EUR: Rp${(1 / (eur || 1)).toFixed(0)}
🇸🇬 SGD: Rp${(1 / (sgd || 1)).toFixed(0)}`,
      );
    } else {
      await msg.reply(
        `💱 *Exchange Rate for ${currency}*

• IDR: Rp${idr?.toLocaleString("id") || "?"}
• USD: ${usd?.toFixed(4) || "?"}`,
      );
    }
  },
});
