import { createWordGame } from "@/game/word-game-factory";

interface AnimeData {
  img: string;
  jawaban: string;
  karakter?: string;
}

const { command, checkAnswer } = createWordGame<AnimeData>({
  name: "Tebak Anime",
  triggers: ["tebakanime", "tba"],
  description: "Guess the anime title from the image (Type 'hint' for help)",
  dataFile: "tebakanime.json",
  emoji: "🎌",
  reward: 15,
  question: (item) => `Anime apa ini?${item.karakter ? `\n\nKarakter: ${item.karakter}` : ""}`,
  answer: (item) => item.jawaban,
  image: (item) => item.img,
  timeoutMessage: (item, _ans) => `⏰ Time's up! The answer: *${item.jawaban}*`,
  correctMessage: (item, _ans) => `✅ Correct! The answer is *${item.jawaban}* (+20 XP)`,
});

export default command;
export const checkTebakAnime = checkAnswer;
