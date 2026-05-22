import { createWordGame } from "@/game/word-game-factory";

interface TebakKalimatData {
  soal: string;
  jawaban: string;
}

const { command, checkAnswer } = createWordGame<TebakKalimatData>({
  name: "Tebak Kalimat",
  triggers: ["tebakkalimat", "tblm"],
  description: "Lengkapi kalimat peribahasa/ungkapan (Ketik 'hint' untuk bantuan)",
  dataFile: "tebakkalimat.json",
  emoji: "📖",
  reward: 15,
  question: (item) => `Kalimat: ${item.soal}`,
  answer: (item) => item.jawaban,
});

export default command;
export const checkTebakKalimat = checkAnswer;
