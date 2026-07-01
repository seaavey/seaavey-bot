import { createWordGame } from "@/game/word-game-factory";

interface MemberData {
  img: string;
  jawaban: string;
  nama_panggilan?: string;
}

const { command, checkAnswer } = createWordGame<MemberData>({
  name: "Tebak Member JKT48",
  triggers: ["tebakmemberjkt48", "tmjkt", "tebakjkt"],
  description: "Guess JKT48 member name from photo",
  dataFile: "tebakmemberjkt48.json",
  emoji: "👩",
  reward: 20,
  question: (item) =>
    `Who is the name of this member?${item.nama_panggilan ? `\n\nClue: ${item.nama_panggilan}` : ""}`,
  answer: (item) => item.jawaban,
  image: (item) => item.img,
  timeoutMessage: (item, _ans) => `⏰ Time's up! The answer: *${item.jawaban}*`,
  correctMessage: (item, _ans) => `✅ Correct! The answer is *${item.jawaban}* (+20 XP)`,
});

export default command;
export const checkTebakMemberJKT48 = checkAnswer;
