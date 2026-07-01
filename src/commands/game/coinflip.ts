import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";

export default defineCommand({
  name: "Coin Flip",
  alias: ["cf", "flip", "coinflip"],
  description: "Guess heads or tails",
  handler: async (_sock, msg) => {
    const input = msg.args[0]?.toLowerCase();
    if (!input || (input !== "heads" && input !== "tails")) {
      return msg.reply("Example: .coinflip heads/tails");
    }

    const result = Math.random() < 0.5 ? "heads" : "tails";
    const emoji = result === "heads" ? "🪙" : "💫";

    if (input === result) {
      addXp(msg.sender, 5);
      await msg.reply(`${emoji} *${result.toUpperCase()}*

🎉 Correct guess! (+5 XP)`);
    } else {
      await msg.reply(`${emoji} *${result.toUpperCase()}*

😢 You guessed ${input}, wrong!`);
    }
  },
});
