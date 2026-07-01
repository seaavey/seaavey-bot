import { t } from "@/core/translations";
import { createWordGame } from "@/game/word-game-factory";

interface MemberData {
  img: string;
  jawaban: string;
  nama_panggilan?: string;
}

const { command, checkAnswer } = createWordGame<MemberData>({
  name: "Tebak Member JKT48",
  triggers: ["tebakmemberjkt48", "tmjkt", "tebakjkt"],
  description: t("game.tebakmemberjkt48.desc"),
  dataFile: "tebakmemberjkt48.json",
  emoji: "👩",
  reward: 20,
  question: (item) =>
    `Siapa nama member ini?${item.nama_panggilan ? `\n\nClue: ${item.nama_panggilan}` : ""}`,
  answer: (item) => item.jawaban,
  image: (item) => item.img,
  timeoutMessage: (item, _ans) =>
    t("game.tebakmemberjkt48.timeout", {
      answer: item.jawaban,
      nickname: item.nama_panggilan ? ` (${item.nama_panggilan})` : "",
    }),
  correctMessage: (item, _ans) => t("game.tebakmemberjkt48.correct", { answer: item.jawaban }),
});

export default command;
export const checkTebakMemberJKT48 = checkAnswer;
