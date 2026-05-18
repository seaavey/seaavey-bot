import { addXp } from "@/infra/database";
import { getRandomNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const choices = ["batu", "gunting", "kertas"] as const;
const emojis = { batu: "🪨", gunting: "✂️", kertas: "📄" };

export default defineCommand({
  name: "suit",
  description: "Batu gunting kertas lawan bot",
  handler: async (_sock, msg) => {
    const input = msg.args[0]?.toLowerCase();
    if (!input || !(choices as readonly string[]).includes(input)) {
      return msg.reply("Contoh: .suit batu/gunting/kertas");
    }

    const player = input as (typeof choices)[number];
    const bot = choices[getRandomNumber(0, 2)] as (typeof choices)[number];

    let result: string;
    if (player === bot) {
      result = "🤝 Seri!";
    } else if (
      (player === "batu" && bot === "gunting") ||
      (player === "gunting" && bot === "kertas") ||
      (player === "kertas" && bot === "batu")
    ) {
      result = "🎉 Kamu menang! (+10 XP)";
      addXp(msg.sender, 10);
    } else {
      result = "😢 Kamu kalah!";
    }

    await msg.reply(`${emojis[player]} vs ${emojis[bot]}\n\n${result}`);
  },
});
