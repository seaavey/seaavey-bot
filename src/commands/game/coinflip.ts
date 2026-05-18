import { addXp } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "coinflip",
  description: "Tebak heads atau tails",
  handler: async (_sock, msg) => {
    const input = msg.args[0]?.toLowerCase();
    if (!input || (input !== "heads" && input !== "tails")) {
      return msg.reply("Contoh: .coinflip heads/tails");
    }

    const result = Math.random() < 0.5 ? "heads" : "tails";
    const emoji = result === "heads" ? "🪙" : "💫";

    if (input === result) {
      addXp(msg.sender, 5);
      await msg.reply(`${emoji} *${result.toUpperCase()}*\n\n🎉 Tebakan benar! (+5 XP)`);
    } else {
      await msg.reply(`${emoji} *${result.toUpperCase()}*\n\n😢 Kamu tebak ${input}, salah!`);
    }
  },
});
