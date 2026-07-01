import { createWordGame } from "@/game/word-game-factory";

interface TBGData {
  img: string;
  jawaban: string;
  deskripsi: string;
}

const { command, checkAnswer } = createWordGame<TBGData>({
  name: "Tebak Gambar",
  triggers: ["tebakgambar", "tbg"],
  description: "Guess the image sent by bot",
  dataFile: "tebakgambar.json",
  emoji: "🖼️",
  reward: 20,
  question: (item) => `Clue: ${item.deskripsi}`,
  answer: (item) => item.jawaban,
  image: (item) => item.img,
  timeoutMessage: (item, _ans) =>
    `⏰ Time's up! The answer: *${item.jawaban}*
Description: ${item.deskripsi}`,
  correctMessage: (item, _ans) => `✅ Correct! The answer is *${item.jawaban}* (+20 XP)`,
});

export default command;
export const checkTebakGambar = checkAnswer;
