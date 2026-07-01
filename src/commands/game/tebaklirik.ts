import { createWordGame } from "@/game/word-game-factory";

interface TebakLirikData {
  soal: string;
  jawaban: string;
}

const { command, checkAnswer } = createWordGame<TebakLirikData>({
  name: "Tebak Lirik",
  triggers: ["tebaklirik", "tblr"],
  description: "Guess the missing word from song lyrics (Type 'hint' for help)",
  dataFile: "tebaklirik.json",
  emoji: "🎵",
  reward: 15,
  question: (item) => `Lyrics: ${item.soal}`,
  answer: (item) => item.jawaban,
});

export default command;
export const checkTebakLirik = checkAnswer;
