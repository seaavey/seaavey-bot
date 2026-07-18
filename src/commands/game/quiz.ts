import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";
import { getRandomItem } from "@/utils/helper";

const questions = [
  {
    q: "What is the official language of Brazil?",
    o: ["Spanish", "Portuguese", "English", "French"],
    a: 1,
  },
  { q: "How many bones are in an adult human body?", o: ["186", "206", "226", "256"], a: 1 },
  { q: "What is the closest planet to the Sun?", o: ["Venus", "Mercury", "Mars", "Earth"], a: 1 },
  {
    q: "Who is the creator of Linux?",
    o: ["Bill Gates", "Steve Jobs", "Linus Torvalds", "Dennis Ritchie"],
    a: 2,
  },
  { q: "What is the capital of Australia?", o: ["Sydney", "Melbourne", "Canberra", "Perth"], a: 2 },
  {
    q: "In what year did Indonesia declare independence?",
    o: ["1944", "1945", "1946", "1947"],
    a: 1,
  },
  {
    q: "Which animal can fly backwards?",
    o: ["Eagle", "Hummingbird", "Owl", "Pelican"],
    a: 1,
  },
  {
    q: "What chemical element has the symbol 'Au'?",
    o: ["Silver", "Gold", "Copper", "Aluminum"],
    a: 1,
  },
  {
    q: "What is the smallest continent in the world?",
    o: ["Europe", "Antarctica", "Australia", "South America"],
    a: 2,
  },
  {
    q: "How many degrees are in the sum of angles of a triangle?",
    o: ["90", "180", "270", "360"],
    a: 1,
  },
];

const sessions = new Map<string, { answer: number; timeout: Timer; sender: string }>();

export default defineCommand({
  name: "Quiz",
  alias: ["quiz"],
  description: "Multiple choice quiz",
  handler: async (sock, msg) => {
    const sessionKey = `${msg.jid}:${msg.sender}`;
    if (sessions.has(sessionKey)) {
      const session = sessions.get(sessionKey);
      if (!session) return;
      const input = msg.args[0]?.toUpperCase();
      if (!input || !["A", "B", "C", "D"].includes(input)) return msg.reply("Answer with A/B/C/D!");

      const idx = input.charCodeAt(0) - 65;
      clearTimeout(session.timeout);
      sessions.delete(sessionKey);

      if (idx === session.answer) {
        addXp(msg.sender, 15);
        return msg.reply(`✅ Correct! The answer is *${input}* (+15 XP)`);
      }
      return msg.reply(`🚩 Wrong! The answer is *${String.fromCharCode(65 + session.answer)}*`);
    }

    const item = getRandomItem(questions) as (typeof questions)[number];
    const options = item.o.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n");

    const key = `${msg.jid}:${msg.sender}`;
    const timeout = setTimeout(() => {
      sessions.delete(key);
      sock.sendMessage(msg.jid, {
        text: `⏰ Time's up! The answer is *${String.fromCharCode(65 + item.a)}*`,
      });
    }, 30_000);
    sessions.set(key, { answer: item.a, timeout, sender: msg.sender });

    await msg.reply(`📝 *Quiz*

${item.q}

${options}

Answer: .quiz [A/B/C/D] (30s)`);
  },
});
