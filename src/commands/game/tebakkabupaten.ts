import { createWordGame } from "@/game/word-game-factory";

interface TebakKabupatenData {
  title: string;
  url: string;
}

const { command, checkAnswer } = createWordGame<TebakKabupatenData>({
  name: "Tebak Kabupaten",
  triggers: ["tebakkabupaten", "tbkp"],
  description: "Guess the district name from its emblem image",
  dataFile: "tebakkabupaten.json",
  emoji: "🏛️",
  reward: 20,
  question: (_item) => "Guess the district/city name from the emblem above!",
  answer: (item) => item.title.replace(/^(Kabupaten|Kota)\s*/i, ""),
  image: (item) => item.url,
  timeoutMessage: (item) => `⏰ Time's up! The answer: *${item.title}*`,
  correctMessage: (item, _ans) => `✅ Correct! The answer is *${item.title}* (+20 XP)`,
});

export default command;
export const checkTebakKabupaten = checkAnswer;
