import { t } from "@/core/translations";
import { createWordGame } from "@/game/word-game-factory";

interface AnimeData {
  img: string;
  jawaban: string;
  karakter?: string;
}

const { command, checkAnswer } = createWordGame<AnimeData>({
  name: "Tebak Anime",
  triggers: ["tebakanime", "tba"],
  description: t("game.tebakanime.desc"),
  dataFile: "tebakanime.json",
  emoji: "🎌",
  reward: 15,
  question: (item) => `Anime apa ini?${item.karakter ? `\n\nKarakter: ${item.karakter}` : ""}`,
  answer: (item) => item.jawaban,
  image: (item) => item.img,
  timeoutMessage: (item, _ans) =>
    t("game.tebakanime.timeout", {
      answer: item.jawaban,
      character: item.karakter ? ` (${item.karakter})` : "",
    }),
  correctMessage: (item, _ans) => t("game.tebakanime.correct", { answer: item.jawaban }),
});

export default command;
export const checkTebakAnime = checkAnswer;
