import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";
import { getRandomNumber } from "@/utils/helper";

const choices = ["batu", "gunting", "kertas"] as const;
const emojis = { batu: "🪨", gunting: "✂️", kertas: "📄" };

export default defineCommand({
  name: "Suit",
  alias: ["suit"],
  description: t("game.suit.desc"),
  handler: async (_sock, msg) => {
    const input = msg.args[0]?.toLowerCase();
    if (!input || !(choices as readonly string[]).includes(input)) {
      return msg.reply(t("game.suit.example"));
    }

    const player = input as (typeof choices)[number];
    const bot = choices[getRandomNumber(0, 2)] as (typeof choices)[number];

    let result: string;
    if (player === bot) {
      result = t("game.suit.draw");
    } else if (
      (player === "batu" && bot === "gunting") ||
      (player === "gunting" && bot === "kertas") ||
      (player === "kertas" && bot === "batu")
    ) {
      result = t("game.suit.win");
      addXp(msg.sender, 10);
    } else {
      result = t("game.suit.lose");
    }

    await msg.reply(
      t("game.suit.result", { playerEmoji: emojis[player], botEmoji: emojis[bot], result }),
    );
  },
});
