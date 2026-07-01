import { createWordGame } from "@/game/word-game-factory";

interface WaifuData {
  img: string;
  jawaban: string;
  seri: string;
}

const { command, checkAnswer } = createWordGame<WaifuData>({
  name: "Tebak Waifu",
  triggers: ["tebakwaifu", "tw"],
  description: "Guess the waifu name from photo (Type 'hint' for help)",
  dataFile: "tebakwaifu.json",
  emoji: "🌸",
  reward: 20,
  question: (_item) => "Siapa nama waifu ini?",
  answer: (item) => item.jawaban,
  image: (item) => item.img,
  timeoutMessage: (item, _ans) => `⏰ Time's up! The answer: *${item.jawaban}*`,
  correctMessage: (item, _ans) => `✅ Correct! The answer is *${item.jawaban}* (+20 XP)`,
});

export default command;
export const checkTebakWaifu = checkAnswer;
