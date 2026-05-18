import { addXp } from "@/infra/database";
import { getRandomItem, getRandomNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const sessions = new Map<string, { answer: number; timeout: Timer; sender?: string }>();

export default defineCommand({
  name: "math",
  description: "Soal matematika cepat",
  handler: async (sock, msg) => {
    if (sessions.has(msg.jid)) return msg.reply("⏳ Masih ada soal yang belum dijawab!");

    const ops = ["+", "-", "×"];
    const op = getRandomItem(ops) as (typeof ops)[number];
    const a = getRandomNumber(1, 50);
    const b = getRandomNumber(1, 20);

    let answer: number;
    if (op === "+") answer = a + b;
    else if (op === "-") answer = a - b;
    else answer = a * b;

    const jid = msg.jid;
    const timeout = setTimeout(() => {
      sessions.delete(jid);
      sock.sendMessage(jid, { text: `⏰ Waktu habis! Jawabannya *${answer}*` });
    }, 30_000);

    sessions.set(msg.jid, { answer, timeout, sender: msg.sender });

    await msg.reply(`🧮 Berapa *${a} ${op} ${b}* ?\n\nJawab dalam 30 detik!`);
  },
});

export function checkMathAnswer(jid: string, text: string, sender: string): string | null {
  const session = sessions.get(jid);
  if (!session) return null;
  if (!jid.endsWith("@g.us") && sender !== session.sender) return null;
  if (Number(text) !== session.answer) return null;

  clearTimeout(session.timeout);
  sessions.delete(jid);
  addXp(sender, 15);
  return `✅ Benar! Jawabannya *${session.answer}* (+15 XP)`;
}
