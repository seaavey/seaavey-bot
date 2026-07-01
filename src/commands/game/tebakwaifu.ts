import { t } from "@/core/translations";
import { createWordGame } from "@/game/word-game-factory";

interface WaifuData {
  img: string;
  jawaban: string;
  seri: string;
}

const { command, checkAnswer } = createWordGame<WaifuData>({
  name: "Tebak Waifu",
  triggers: ["tebakwaifu", "tw"],
  description: t("game.tebakwaifu.desc"),
  dataFile: "tebakwaifu.json",
  emoji: "🌸",
  reward: 20,
  question: (_item) => "Siapa nama waifu ini?",
  answer: (item) => item.jawaban,
  image: (item) => item.img,
  timeoutMessage: (item, _ans) =>
    t("game.tebakwaifu.timeout", { answer: item.jawaban, series: item.seri }),
  correctMessage: (item, _ans) => t("game.tebakwaifu.correct", { answer: item.jawaban }),
});

export default command;
export const checkTebakWaifu = checkAnswer;
