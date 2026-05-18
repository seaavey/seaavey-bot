import { addXp } from "@/infra/database";
import { getRandomItem } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const flags = [
  { emoji: "🇮🇩", answer: "indonesia" },
  { emoji: "🇯🇵", answer: "jepang" },
  { emoji: "🇰🇷", answer: "korea" },
  { emoji: "🇺🇸", answer: "amerika" },
  { emoji: "🇬🇧", answer: "inggris" },
  { emoji: "🇫🇷", answer: "prancis" },
  { emoji: "🇩🇪", answer: "jerman" },
  { emoji: "🇮🇹", answer: "italia" },
  { emoji: "🇪🇸", answer: "spanyol" },
  { emoji: "🇧🇷", answer: "brasil" },
  { emoji: "🇷🇺", answer: "rusia" },
  { emoji: "🇨🇳", answer: "china" },
  { emoji: "🇮🇳", answer: "india" },
  { emoji: "🇹🇭", answer: "thailand" },
  { emoji: "🇲🇾", answer: "malaysia" },
  { emoji: "🇸🇬", answer: "singapura" },
  { emoji: "🇦🇺", answer: "australia" },
  { emoji: "🇨🇦", answer: "kanada" },
  { emoji: "🇲🇽", answer: "meksiko" },
  { emoji: "🇪🇬", answer: "mesir" },
  { emoji: "🇹🇷", answer: "turki" },
  { emoji: "🇸🇦", answer: "arab saudi" },
  { emoji: "🇦🇷", answer: "argentina" },
  { emoji: "🇳🇱", answer: "belanda" },
];

const sessions = new Map<
  string,
  { answer: string; emoji: string; timeout: Timer; sender?: string }
>();

export default defineCommand({
  name: "tebakbendera",
  description: "Tebak negara dari emoji bendera",
  handler: async (sock, msg) => {
    if (sessions.has(msg.jid)) return msg.reply("⏳ Masih ada soal yang belum dijawab!");
    const flag = getRandomItem(flags) as (typeof flags)[number];
    const jid = msg.jid;
    const timeout = setTimeout(() => {
      sessions.delete(jid);
      sock.sendMessage(jid, {
        text: `⏰ Waktu habis! Jawabannya *${flag.answer}* ${flag.emoji}`,
      });
    }, 30_000);
    sessions.set(jid, { answer: flag.answer, emoji: flag.emoji, timeout, sender: msg.sender });
    await msg.reply(`🏁 *Tebak Bendera!*\n\n${flag.emoji}\n\nNegara apa ini? (30 detik)`);
  },
});

export function checkTebakBendera(jid: string, text: string, sender: string): string | null {
  const session = sessions.get(jid);
  if (!session) return null;
  if (!jid.endsWith("@g.us") && sender !== session.sender) return null;
  if (text.toLowerCase() !== session.answer) return null;
  clearTimeout(session.timeout);
  sessions.delete(jid);
  addXp(sender, 15);
  return `✅ Benar! ${session.emoji} = *${session.answer}* (+15 XP)`;
}
