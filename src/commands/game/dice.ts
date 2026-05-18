import { addXp } from "@/infra/database";
import { getRandomNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";
export default defineCommand({
  name: "dice",
  description: "Tebak angka dadu (1-6)",
  handler: async (_sock, msg) => {
    const guess = Number(msg.args[0]);
    if (!guess || guess < 1 || guess > 6) {
      return msg.reply("Contoh: .dice 4 (tebak angka 1-6)");
    }

    const result = getRandomNumber(1, 6);

    if (guess === result) {
      addXp(msg.sender, 15);
      await msg.reply(`🎲 Dadu: *${result}*\n\n🎉 Tebakan benar! (+15 XP)`);
    } else {
      await msg.reply(`🎲 Dadu: *${result}*\n\n😢 Kamu tebak ${guess}, salah!`);
    }
  },
});
