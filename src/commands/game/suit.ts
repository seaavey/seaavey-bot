import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";
import { getRandomNumber } from "@/utils/helper";

const choices = ["batu", "gunting", "kertas"] as const;
const emojis = { batu: "🪨", gunting: "✂️", kertas: "📄" };

export default defineCommand({
  name: "Suit",
  alias: ["suit"],
  description: "Rock paper scissors against bot",
  handler: async (_sock, msg) => {
    const input = msg.args[0]?.toLowerCase();
    if (!input || !(choices as readonly string[]).includes(input)) {
      return msg.reply("Example: .suit batu/gunting/kertas");
    }

    const player = input as (typeof choices)[number];
    const bot = choices[getRandomNumber(0, 2)] as (typeof choices)[number];

    let result: string;
    if (player === bot) {
      result = "🤝 Draw!";
    } else if (
      (player === "batu" && bot === "gunting") ||
      (player === "gunting" && bot === "kertas") ||
      (player === "kertas" && bot === "batu")
    ) {
      result = "🎉 You win! (+10 XP)";
      addXp(msg.sender, 10);
    } else {
      result = "😢 You lose!";
    }

    await msg.reply(
      `${emojis[player]} vs ${emojis[bot]}

${result}`,
    );
  },
});
