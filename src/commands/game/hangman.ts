import { addXp } from "@/infra/database";
import { getRandomItem } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const words = [
  "programming",
  "javascript",
  "indonesia",
  "komputer",
  "handphone",
  "keyboard",
  "internet",
  "database",
  "algoritma",
  "teknologi",
  "universitas",
  "perpustakaan",
  "matematika",
  "astronomi",
  "geografi",
];

const sessions = new Map<
  string,
  { word: string; guessed: Set<string>; lives: number; timeout: Timer }
>();

function render(word: string, guessed: Set<string>): string {
  return word
    .split("")
    .map((c) => (guessed.has(c) ? c : "_"))
    .join(" ");
}

export default defineCommand({
  name: "hangman",
  description: "Tebak huruf satu-satu",
  handler: async (sock, msg) => {
    const key = `${msg.jid}:${msg.sender}`;
    const session = sessions.get(key);

    if (msg.args[0] === "nyerah" && session) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      return msg.reply(`🏳️ Menyerah! Jawabannya: *${session.word}*`);
    }

    if (!msg.args[0]) {
      if (session)
        return msg.reply(
          `🎯 *Hangman*\n\n${render(session.word, session.guessed)}\n❤️ ${session.lives} nyawa\nHuruf: ${[...session.guessed].join(", ") || "-"}\n\nKetik .hangman [huruf]`,
        );
      const word = getRandomItem(words) as string;
      const jid = msg.jid;
      const timeout = setTimeout(() => {
        sessions.delete(key);
        sock.sendMessage(jid, { text: `⏰ Waktu habis! Jawabannya *${word}*` });
      }, 120_000);
      sessions.set(key, { word, guessed: new Set(), lives: 6, timeout });
      return msg.reply(
        `🎯 *Hangman* (${word.length} huruf)\n\n${render(word, new Set())}\n❤️ 6 nyawa\n\nKetik .hangman [huruf]`,
      );
    }

    if (!session) return msg.reply("Ketik .hangman untuk mulai game baru.");

    const letter = msg.args[0].toLowerCase();
    if (letter.length !== 1 || !/[a-z]/.test(letter)) return msg.reply("❌ Masukkan 1 huruf!");
    if (session.guessed.has(letter)) return msg.reply("❌ Huruf sudah ditebak!");

    session.guessed.add(letter);

    if (!session.word.includes(letter)) {
      session.lives--;
      if (session.lives <= 0) {
        clearTimeout(session.timeout);
        sessions.delete(key);
        return msg.reply(`💀 Game over! Jawabannya: *${session.word}*`);
      }
    }

    const display = render(session.word, session.guessed);
    if (!display.includes("_")) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      addXp(msg.sender, 20);
      return msg.reply(`🎉 Benar! *${session.word}* (+20 XP)`);
    }

    await msg.reply(
      `🎯 ${display}\n❤️ ${session.lives} nyawa\nHuruf: ${[...session.guessed].join(", ")}`,
    );
  },
});
