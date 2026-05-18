import { addXp } from "@/infra/database";
import { getRandomItem } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const questions = [
  { q: "Apa bahasa resmi Brasil?", o: ["Spanyol", "Portugis", "Inggris", "Prancis"], a: 1 },
  { q: "Berapa jumlah tulang manusia dewasa?", o: ["186", "206", "226", "256"], a: 1 },
  { q: "Planet terdekat dari matahari?", o: ["Venus", "Merkurius", "Mars", "Bumi"], a: 1 },
  {
    q: "Siapa pencipta Linux?",
    o: ["Bill Gates", "Steve Jobs", "Linus Torvalds", "Dennis Ritchie"],
    a: 2,
  },
  { q: "Apa ibu kota Australia?", o: ["Sydney", "Melbourne", "Canberra", "Perth"], a: 2 },
  { q: "Tahun kemerdekaan Indonesia?", o: ["1944", "1945", "1946", "1947"], a: 1 },
  {
    q: "Hewan apa yang bisa terbang mundur?",
    o: ["Elang", "Kolibri", "Burung hantu", "Pelikan"],
    a: 1,
  },
  { q: "Apa unsur kimia dengan simbol 'Au'?", o: ["Perak", "Emas", "Tembaga", "Aluminium"], a: 1 },
  {
    q: "Benua terkecil di dunia?",
    o: ["Eropa", "Antartika", "Australia", "Amerika Selatan"],
    a: 2,
  },
  { q: "Berapa derajat sudut segitiga?", o: ["90", "180", "270", "360"], a: 1 },
];

const sessions = new Map<string, { answer: number; timeout: Timer; sender?: string }>();

export default defineCommand({
  name: "quiz",
  description: "Quiz pilihan ganda",
  handler: async (sock, msg) => {
    if (sessions.has(msg.jid)) {
      const session = sessions.get(msg.jid);
      if (!session) return;
      const input = msg.args[0]?.toUpperCase();
      if (!input || !["A", "B", "C", "D"].includes(input))
        return msg.reply("Jawab dengan A/B/C/D!");

      const idx = input.charCodeAt(0) - 65;
      clearTimeout(session.timeout);
      sessions.delete(msg.jid);

      if (idx === session.answer) {
        addXp(msg.sender, 15);
        return msg.reply(`✅ Benar! Jawabannya *${input}* (+15 XP)`);
      }
      return msg.reply(`❌ Salah! Jawabannya *${String.fromCharCode(65 + session.answer)}*`);
    }

    const item = getRandomItem(questions) as (typeof questions)[number];
    const options = item.o.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n");

    const jid = msg.jid;
    const timeout = setTimeout(() => {
      sessions.delete(jid);
      sock.sendMessage(jid, {
        text: `⏰ Waktu habis! Jawabannya *${String.fromCharCode(65 + item.a)}*`,
      });
    }, 30_000);
    sessions.set(msg.jid, { answer: item.a, timeout });

    await msg.reply(`📝 *Quiz*\n\n${item.q}\n\n${options}\n\nJawab: .quiz [A/B/C/D] (30 detik)`);
  },
});
