import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";
import { getRandomItem } from "@/utils/helper";

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
  name: "Hangman",
  alias: ["hangman"],
  description: "Guess letters one by one",
  handler: async (sock, msg) => {
    const key = `${msg.jid}:${msg.sender}`;
    const session = sessions.get(key);

    if (msg.args[0] === "nyerah" && session) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      return msg.reply(`🏳️ Giving up! The answer: *${session.word}*`);
    }

    if (!msg.args[0]) {
      if (session)
        return msg.reply(
          `🎯 *Hangman*

${render(session.word, session.guessed)}
❤️ ${session.lives} lives
Letters: ${[...session.guessed].join(", ") || "-"}

Type .hangman [letter]`,
        );
      const word = getRandomItem(words) as string;
      const jid = msg.jid;
      const timeout = setTimeout(() => {
        sessions.delete(key);
        sock.sendMessage(jid, { text: `⏰ Time's up! The answer is *${word}*` });
      }, 120_000);
      sessions.set(key, { word, guessed: new Set(), lives: 6, timeout });
      return msg.reply(
        `🎯 *Hangman* (${word.length} letters)

${render(word, new Set())}
❤️ 6 lives

Type .hangman [letter]`,
      );
    }

    if (!session) return msg.reply("Type .hangman to start a new game.");

    const letter = msg.args[0].toLowerCase();
    if (letter.length !== 1 || !/[a-z]/.test(letter)) return msg.reply("🚩 Enter 1 letter!");
    if (session.guessed.has(letter)) return msg.reply("🚩 Letter already guessed!");

    session.guessed.add(letter);

    if (!session.word.includes(letter)) {
      session.lives--;
      if (session.lives <= 0) {
        clearTimeout(session.timeout);
        sessions.delete(key);
        return msg.reply(`💀 Game over! The answer: *${session.word}*`);
      }
    }

    const display = render(session.word, session.guessed);
    if (!display.includes("_")) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      addXp(msg.sender, 20);
      return msg.reply(`🎉 Correct! *${session.word}* (+20 XP)`);
    }

    await msg.reply(
      `🎯 ${display}
❤️ ${session.lives} lives
Letters: ${[...session.guessed].join(", ")}`,
    );
  },
});
