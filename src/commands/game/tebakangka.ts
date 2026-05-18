import { addXp } from "@/infra/database";
import { getRandomNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const sessions = new Map<string, { answer: number; attempts: number; timeout: Timer }>();

export default defineCommand({
  name: "tebakangka",
  description: "Tebak angka 1-100 (ada hint higher/lower)",
  handler: async (sock, msg) => {
    const key = `${msg.jid}:${msg.sender}`;
    const session = sessions.get(key);

    if (!msg.args[0]) {
      if (session) return msg.reply("⏳ Kamu masih punya game! Ketik .tebakangka [angka]");
      const answer = getRandomNumber(1, 100);
      const jid = msg.jid;
      const timeout = setTimeout(() => {
        sessions.delete(key);
        sock.sendMessage(jid, { text: `⏰ Waktu habis! Jawabannya *${answer}*` });
      }, 120_000);
      sessions.set(key, { answer, attempts: 0, timeout });
      return msg.reply(
        "🔢 Aku sudah pilih angka 1-100.\nTebak dengan .tebakangka [angka]\n\n10 kesempatan, 120 detik!",
      );
    }

    if (!session) return msg.reply("Ketik .tebakangka untuk mulai game baru.");

    if (msg.args[0] === "nyerah") {
      clearTimeout(session.timeout);
      sessions.delete(key);
      return msg.reply(`🏳️ Menyerah! Jawabannya: *${session.answer}*`);
    }

    const guess = Number(msg.args[0]);
    if (!guess || guess < 1 || guess > 100) return msg.reply("❌ Masukkan angka 1-100!");

    session.attempts++;

    if (guess === session.answer) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      const xp = Math.max(30 - session.attempts * 3, 10);
      addXp(msg.sender, xp);
      return msg.reply(
        `🎉 Benar! Jawabannya *${session.answer}* dalam ${session.attempts} percobaan (+${xp} XP)`,
      );
    }

    if (session.attempts >= 10) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      return msg.reply(`😢 Kesempatan habis! Jawabannya *${session.answer}*`);
    }

    const hint = guess < session.answer ? "⬆️ Lebih tinggi!" : "⬇️ Lebih rendah!";
    await msg.reply(`${hint} (percobaan ${session.attempts}/10)`);
  },
});
