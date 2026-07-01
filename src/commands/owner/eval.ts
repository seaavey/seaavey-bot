import util from "node:util";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Eval",
  command: ">",
  description: "Eval JavaScript code",
  ownerOnly: true,
  handler: async (sock, msg) => {
    const code = msg.body.slice(2).trim();
    if (!code) return msg.reply("Masukkan kode!");
    try {
      void sock; // available in eval scope
      // biome-ignore lint/security/noGlobalEval: intentional eval command
      const result = eval(code);
      await msg.reply(util.format(result));
    } catch (e: unknown) {
      await msg.reply(e instanceof Error ? e.message : String(e));
    }
  },
});
