import { createWordGame } from "@/game/word-game-factory";

interface TebakKimiaData {
  unsur: string;
  lambang: string;
}

const { command, checkAnswer } = createWordGame<TebakKimiaData>({
  name: "Tebak Kimia",
  triggers: ["tebakkimia", "tbkm"],
  description: "Guess the chemical element symbol (Type 'hint' for help)",
  dataFile: "tebakkimia.json",
  emoji: "⚗️",
  reward: 15,
  question: (item) => `Element: *${item.unsur}*\n\nType the chemical symbol!`,
  answer: (item) => item.lambang,
  timeoutMessage: (item, ans) => `⏰ Time's up! The answer: *${ans}*`,
  correctMessage: (item, ans) => `✅ Correct! The answer is *${ans.toUpperCase()}* (+15 XP)`,
});

export default command;
export const checkTebakKimia = checkAnswer;
