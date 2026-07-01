import { createWordGame } from "@/game/word-game-factory";

interface TebakKalimatData {
  soal: string;
  jawaban: string;
}

const { command, checkAnswer } = createWordGame<TebakKalimatData>({
  name: "Tebak Kalimat",
  triggers: ["tebakkalimat", "tblm"],
  description: "Complete the proverb/phrase (Type 'hint' for help)",
  dataFile: "tebakkalimat.json",
  emoji: "📖",
  reward: 15,
  question: (item) => `Sentence: ${item.soal}`,
  answer: (item) => item.jawaban,
});

export default command;
export const checkTebakKalimat = checkAnswer;
