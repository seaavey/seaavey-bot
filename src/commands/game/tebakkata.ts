import { addXp } from "@/infra/database";
import { getRandomItem } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const words = [
  "javascript",
  "komputer",
  "handphone",
  "keyboard",
  "internet",
  "whatsapp",
  "telegram",
  "instagram",
  "youtube",
  "facebook",
  "sekolah",
  "universitas",
  "perpustakaan",
  "matematika",
  "biologi",
  "indonesia",
  "bandung",
  "jakarta",
  "surabaya",
  "makassar",
  "kucing",
  "anjing",
  "kelinci",
  "harimau",
  "gajah",
];

const sessions = new Map<string, { word: string; timeout: Timer; sender?: string }>();

function shuffle(word: string): string {
  return word
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export default defineCommand({
  name: "tebakkata",
  description: "Tebak kata dari huruf acak",
  handler: async (sock, msg) => {
    if (sessions.has(msg.jid)) return msg.reply("⏳ Masih ada soal yang belum dijawab!");

    const word = getRandomItem(words) as string;
    let shuffled = shuffle(word);
    while (shuffled === word) shuffled = shuffle(word);

    const jid = msg.jid;
    const timeout = setTimeout(() => {
      sessions.delete(jid);
      sock.sendMessage(jid, { text: `⏰ Waktu habis! Jawabannya *${word}*` });
    }, 60_000);

    sessions.set(msg.jid, { word, timeout, sender: msg.sender });

    await msg.reply(
      `🔤 Susun huruf berikut:\n\n*${shuffled.toUpperCase()}*\n\nJawab dalam 60 detik!`,
    );
  },
});

export function checkTebakKata(jid: string, text: string, sender: string): string | null {
  const session = sessions.get(jid);
  if (!session) return null;
  if (!jid.endsWith("@g.us") && sender !== session.sender) return null;
  if (text.toLowerCase() !== session.word) return null;

  clearTimeout(session.timeout);
  sessions.delete(jid);
  addXp(sender, 20);
  return `✅ Benar! Jawabannya *${session.word}* (+20 XP)`;
}
