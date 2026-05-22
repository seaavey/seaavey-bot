import { createWordGame } from "@/game/word-game-factory";

interface TebakKabupatenData {
  title: string;
  url: string;
}

const { command, checkAnswer } = createWordGame<TebakKabupatenData>({
  name: "Tebak Kabupaten",
  triggers: ["tebakkabupaten", "tbkp"],
  description: "Tebak nama kabupaten dari gambar lambang daerah",
  dataFile: "tebakkabupaten.json",
  emoji: "🏛️",
  reward: 20,
  question: (_item) => "Tebak nama kabupaten/kota dari lambang di atas!",
  answer: (item) => item.title.replace(/^(Kabupaten|Kota)\s*/i, ""),
  image: (item) => item.url,
  timeoutMessage: (item) => `⏰ Habis! Jawabannya: *${item.title}*`,
  correctMessage: (item, _ans) => `✅ Benar! Jawabannya *${item.title}* (+20 XP)`,
});

export default command;
export const checkTebakKabupaten = checkAnswer;
