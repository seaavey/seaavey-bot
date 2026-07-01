import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";
import { getRandomItem, loadGameData } from "@/utils/helper";

const localData = loadGameData<{ soal: string; jawaban: string[] }>("family100.json");

const sessions = new Map<
  string,
  {
    question: string;
    answers: string[];
    answered: string[];
    timeout: Timer;
  }
>();

export default defineCommand({
  name: "Family 100",
  alias: ["f100", "family100"],
  description: "Play Family 100 game in the group",
  groupOnly: true,
  handler: async (sock, msg) => {
    if (sessions.has(msg.jid)) {
      return msg.reply("⏳ There is already an active Family 100 session in this group!");
    }

    if (localData.length === 0) {
      return msg.reply("🚩 Family 100 game data is not available.");
    }

    const surveyData = getRandomItem(localData) as (typeof localData)[number];
    const jid = msg.jid;
    const question = surveyData.soal;
    const answers = surveyData.jawaban.map((a) => a.toLowerCase().trim());

    const timeout = setTimeout(() => {
      const session = sessions.get(jid);
      if (session) {
        sessions.delete(jid);
        const unanswered = session.answers.filter((a) => !session.answered.includes(a));
        const list = unanswered.map((a, i) => `${i + 1}. ${a}`).join("\n");
        sock.sendMessage(jid, { text: `⏰ Time's up! Unanswered answers:\n\n${list}` });
      }
    }, 120_000); // 2 minutes

    sessions.set(jid, {
      question,
      answers,
      answered: [],
      timeout,
    });

    const blanks = answers.map((_, i) => `${i + 1}. ⬛⬛⬛⬛⬛`).join("\n");

    await msg.reply(`🎯 *FAMILY 100* 🎯

*Question:* ${question}

There are *${answers.length}* answers:
${blanks}

Type your answer directly in this group. You have 2 minutes!`);
  },
});

export function checkFamily100(jid: string, text: string, sender: string): string | null {
  const session = sessions.get(jid);
  if (!session) return null;

  const answer = text.toLowerCase().trim();
  const index = session.answers.indexOf(answer);

  if (index !== -1) {
    if (session.answered.includes(answer)) {
      return `⚠️ The answer *${answer}* has already been guessed!`;
    }

    session.answered.push(answer);
    addXp(sender, 50);

    if (session.answered.length === session.answers.length) {
      clearTimeout(session.timeout);
      sessions.delete(jid);
      return `🎉 *PERFECT!* All answers have been guessed! (+50 XP)\n\nLast answer: *${answer}*`;
    }

    let board = `🎯 *FAMILY 100* 🎯\n\n*Question:* ${session.question}\n\n`;
    session.answers.forEach((ans, i) => {
      if (session.answered.includes(ans)) {
        board += `${i + 1}. ${ans} ✅\n`;
      } else {
        board += `${i + 1}. ⬛⬛⬛⬛⬛\n`;
      }
    });

    return `${board.trim()}\n\nCorrect! *${answer}* (+50 XP)`;
  }

  return null;
}
