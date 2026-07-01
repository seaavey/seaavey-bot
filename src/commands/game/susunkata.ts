import { createWordGame } from "@/game/word-game-factory";

interface SusunKataData {
  soal: string;
  tipe: string;
  jawaban: string;
}

const { command, checkAnswer } = createWordGame<SusunKataData>({
  name: "Susun Kata",
  triggers: ["susunkata", "sk"],
  description: "Arrange scrambled letters into the correct word",
  dataFile: "susunkata.json",
  emoji: "🔤",
  reward: 15,
  question: (item) => `Huruf: *${item.soal}*\nTipe: *${item.tipe}*`,
  answer: (item) => item.jawaban,
});

export default command;
export const checkSusunKata = checkAnswer;
