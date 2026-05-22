import { createWordGame } from "@/game/word-game-factory";

interface WaifuData {
  img: string;
  jawaban: string;
  seri: string;
}

const { command, checkAnswer } = createWordGame<WaifuData>({
  name: "Tebak Waifu",
  triggers: ["tebakwaifu", "tw"],
  description: "Tebak nama waifu dari foto (Ketik 'hint' untuk bantuan)",
  dataFile: "tebakwaifu.json",
  emoji: "🌸",
  reward: 20,
  question: (_item) => "Siapa nama waifu ini?",
  answer: (item) => item.jawaban,
  image: (item) => item.img,
  timeoutMessage: (item, _ans) => `⏰ Habis! Jawabannya: *${item.jawaban}* (${item.seri})`,
  correctMessage: (item, _ans) => `✅ Benar! Jawabannya *${item.jawaban}* (+20 XP)`,
});

export default command;
export const checkTebakWaifu = checkAnswer;
