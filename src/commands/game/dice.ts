import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";
import { getRandomNumber } from "@/utils/helper";
export default defineCommand({
  name: "Dice",
  alias: ["dice"],
  description: "Guess the dice number (1-6)",
  handler: async (_sock, msg) => {
    const guess = Number(msg.args[0]);
    if (!guess || guess < 1 || guess > 6) {
      return msg.reply("Example: .dice 4 (guess number 1-6)");
    }

    const result = getRandomNumber(1, 6);

    if (guess === result) {
      addXp(msg.sender, 15);
      await msg.reply(`🎲 Dice: *${result}*

🎉 Correct guess! (+15 XP)`);
    } else {
      await msg.reply(`🎲 Dice: *${result}*

😢 You guessed ${guess}, wrong!`);
    }
  },
});
