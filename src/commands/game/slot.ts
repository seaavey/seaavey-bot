import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";
import { getRandomItem } from "@/utils/helper";

const symbols = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎"];

export default defineCommand({
  name: "Slot",
  alias: ["slot"],
  description: "Slot machine 🎰",
  handler: async (_sock, msg) => {
    const s1 = getRandomItem(symbols);
    const s2 = getRandomItem(symbols);
    const s3 = getRandomItem(symbols);

    let result: string;
    if (s1 === s2 && s2 === s3) {
      const xp = s1 === "💎" ? 50 : 25;
      addXp(msg.sender, xp);
      result = `JACKPOT! ${xp} XP`;
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      addXp(msg.sender, 5);
      result = "😏 Almost! 2 match (+5 XP)";
    } else {
      result = "😢 Try again!";
    }

    await msg.reply(`🎰 *Slot Machine*

[ ${s1} | ${s2} | ${s3} ]

${result}`);
  },
});
