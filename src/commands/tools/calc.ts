import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "calc",
  description: "Kalkulator. Contoh: .calc 2+2*5",
  handler: async (_sock, msg) => {
    const expr = msg.args.join(" ");
    if (!expr) return msg.reply("Format: .calc <ekspresi>\nContoh: .calc 2+2*5");
    if (!/^[\d\s+\-*/().%^]+$/.test(expr)) return msg.reply("❌ Ekspresi tidak valid.");
    try {
      const result = Function(`"use strict"; return (${expr.replace(/\^/g, "**")})`)();
      await msg.reply(`🧮 *Kalkulator*\n\n${expr} = *${result}*`);
    } catch {
      await msg.reply("❌ Ekspresi tidak valid.");
    }
  },
});
