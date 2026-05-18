import { addXp } from "@/infra/database";
import { defineCommand } from "@/core/types";

const sessions = new Map<string, { lastWord: string; used: Set<string>; timeout: Timer }>();

export default defineCommand({
  name: "wordchain",
  description: "Sambung kata (huruf terakhir = huruf pertama)",
  handler: async (sock, msg) => {
    const session = sessions.get(msg.jid);
    const word = msg.args[0]?.toLowerCase();

    if (!word) {
      if (session)
        return msg.reply(
          `🔗 Kata terakhir: *${session.lastWord}*\nSambung dengan huruf *${session.lastWord.slice(-1).toUpperCase()}*\n\nKetik .wordchain [kata]`,
        );
      const jid = msg.jid;
      const timeout = setTimeout(() => {
        const s = sessions.get(jid);
        sessions.delete(jid);
        sock.sendMessage(jid, {
          text: `⏰ Waktu habis! Word Chain selesai. Total ${s?.used.size ?? 0} kata.`,
        });
      }, 120_000);
      sessions.set(msg.jid, { lastWord: "indonesia", used: new Set(["indonesia"]), timeout });
      return msg.reply(
        "🔗 *Word Chain* dimulai!\n\nKata pertama: *indonesia*\nSambung dengan huruf *A*\n\nKetik .wordchain [kata]",
      );
    }

    if (!session) return msg.reply("Ketik .wordchain untuk mulai game baru.");

    if (word === "nyerah") {
      clearTimeout(session.timeout);
      sessions.delete(msg.jid);
      return msg.reply(`🏳️ Menyerah! Total ${session.used.size} kata.`);
    }

    if (word.length < 3) return msg.reply("❌ Minimal 3 huruf!");
    if (session.used.has(word)) return msg.reply("❌ Kata sudah dipakai!");
    if (word[0] !== session.lastWord.slice(-1)) {
      return msg.reply(
        `❌ Harus dimulai dengan huruf *${session.lastWord.slice(-1).toUpperCase()}*!`,
      );
    }

    session.used.add(word);
    session.lastWord = word;
    clearTimeout(session.timeout);
    const jid = msg.jid;
    session.timeout = setTimeout(() => {
      const s = sessions.get(jid);
      sessions.delete(jid);
      sock.sendMessage(jid, {
        text: `⏰ Waktu habis! Word Chain selesai. Total ${s?.used.size ?? 0} kata.`,
      });
    }, 120_000);

    addXp(msg.sender, 3);
    await msg.reply(
      `✅ *${word}* (+3 XP)\n\nSambung dengan huruf *${word.slice(-1).toUpperCase()}*`,
    );
  },
});
