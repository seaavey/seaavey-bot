import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";
import { getRandomNumber } from "@/utils/helper";

const sessions = new Map<string, { answer: number; attempts: number; timeout: Timer }>();

export default defineCommand({
  name: "Tebak Angka",
  alias: ["tbka", "tebakangka"],
  description: "Guess number 1-100 (with higher/lower hints)",
  handler: async (sock, msg) => {
    const key = `${msg.jid}:${msg.sender}`;
    const session = sessions.get(key);

    if (!msg.args[0]) {
      if (session) return msg.reply("⏳ You already have a game! Type .tebakangka [number]");
      const answer = getRandomNumber(1, 100);
      const jid = msg.jid;
      const timeout = setTimeout(() => {
        sessions.delete(key);
        sock.sendMessage(jid, { text: `⏰ Time's up! The answer was *${answer}*` });
      }, 120_000);
      sessions.set(key, { answer, attempts: 0, timeout });
      return msg.reply(
        "🔢 I've picked a number 1-100.\nGuess with .tebakangka [number]\n\n10 attempts, 120 seconds!",
      );
    }

    if (!session) return msg.reply("Type .tebakangka to start a new game.");

    if (msg.args[0] === "nyerah") {
      clearTimeout(session.timeout);
      sessions.delete(key);
      return msg.reply(`🏳️ Giving up! The answer was: *${session.answer}*`);
    }

    const guess = Number(msg.args[0]);
    if (!guess || guess < 1 || guess > 100) return msg.reply("🚩 Enter a number 1-100!");

    session.attempts++;

    if (guess === session.answer) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      const xp = Math.max(30 - session.attempts * 3, 10);
      addXp(msg.sender, xp);
      return msg.reply(
        `🎉 Correct! The answer is *${session.answer}* in ${session.attempts} attempts (+${xp} XP)`,
      );
    }

    if (session.attempts >= 10) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      return msg.reply(`😢 No more attempts! The answer was *${session.answer}*`);
    }

    const hint = guess < session.answer ? "⬆️ Lebih tinggi!" : "⬇️ Lebih rendah!";
    await msg.reply(`${hint} (attempt ${session.attempts}/10)`);
  },
});
