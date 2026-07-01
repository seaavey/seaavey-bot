import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";
import { getRandomItem } from "@/utils/helper";

const questions = [
  { q: "What is the capital of France?", a: "paris" },
  { q: "What is the largest planet in our solar system?", a: "jupiter" },
  { q: "Who invented the telephone?", a: "alexander graham bell" },
  { q: "What is the largest animal in the world?", a: "blue whale" },
  { q: "What is the highest mountain in the world?", a: "everest" },
  { q: "What programming language was created by Brendan Eich?", a: "javascript" },
  { q: "What is the largest country in the world by land area?", a: "russia" },
  { q: "What is the result of 12 x 12?", a: "144" },
  { q: "What is the longest river in the world?", a: "nile" },
  { q: "How many players are on the field for one team in a soccer match?", a: "11" },
  { q: "What is the official currency of Japan?", a: "yen" },
  { q: "What is the capital city of Germany?", a: "berlin" },
  { q: "What color is a ripe banana?", a: "yellow" },
  { q: "What is the chemical formula for water?", a: "h2o" },
  { q: "Who wrote the play 'Romeo and Juliet'?", a: "shakespeare" },
];

const sessions = new Map<string, { answer: string; timeout: Timer; sender?: string }>();

export default defineCommand({
  name: "Trivia",
  alias: ["trivia"],
  description: "General knowledge quiz",
  handler: async (sock, msg) => {
    if (sessions.has(msg.jid)) return msg.reply("⏳ There's still an unanswered question!");

    const item = getRandomItem(questions) as (typeof questions)[number];

    const jid = msg.jid;
    const timeout = setTimeout(() => {
      sessions.delete(jid);
      sock.sendMessage(jid, { text: `⏰ Time's up! The answer is *${item.a}*` });
    }, 30_000);

    sessions.set(msg.jid, { answer: item.a, timeout });

    await msg.reply(`❓ *Trivia*

${item.q}

Answer in 30 seconds!`);
  },
});

export function checkTrivia(jid: string, text: string, sender: string): string | null {
  const session = sessions.get(jid);
  if (!session) return null;
  if (!jid.endsWith("@g.us") && sender !== session.sender) return null;
  if (!text.toLowerCase().includes(session.answer)) return null;

  clearTimeout(session.timeout);
  sessions.delete(jid);
  addXp(sender, 15);
  return `✅ Correct! The answer is *${session.answer}* (+15 XP)`;
}
