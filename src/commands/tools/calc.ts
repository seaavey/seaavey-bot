import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Calc",
  alias: ["calc"],
  description: "Calculator. Example: .calc 2+2*5",
  handler: async (_sock, msg) => {
    const expr = msg.args.join(" ");
    if (!expr) return msg.reply("Format: .calc <ekspresi>");
    if (!/^[\d\s+\-*/().%^]+$/.test(expr)) return msg.reply("🚩 Invalid expression.");
    try {
      const result = Function(`"use strict"; return (${expr.replace(/\^/g, "**")})`)();
      await msg.reply(`📊 *Result*

${expr} = ${String(result)}`);
    } catch {
      await msg.reply("🚩 Invalid expression.");
    }
  },
});
