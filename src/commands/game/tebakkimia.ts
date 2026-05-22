import { createWordGame } from "@/game/word-game-factory";

interface TebakKimiaData {
  unsur: string;
  lambang: string;
}

const { command, checkAnswer } = createWordGame<TebakKimiaData>({
  name: "Tebak Kimia",
  triggers: ["tebakkimia", "tbkm"],
  description: "Tebak lambang unsur kimia (Ketik 'hint' untuk bantuan)",
  dataFile: "tebakkimia.json",
  emoji: "⚗️",
  reward: 15,
  question: (item) => `Unsur: *${item.unsur}*\n\nKetik lambang unsurnya!`,
  answer: (item) => item.lambang,
  timeoutMessage: (item, ans) => `⏰ Habis! Jawabannya: *${ans}* (${item.unsur})`,
  correctMessage: (item, ans) =>
    `✅ Benar! Lambang dari *${item.unsur}* adalah *${ans.toUpperCase()}* (+15 XP)`,
});

export default command;
export const checkTebakKimia = checkAnswer;
