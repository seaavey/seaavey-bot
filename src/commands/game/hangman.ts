import { t } from "@/core/translations";
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
  description: t("game.hangman.desc"),
  handler: async (sock, msg) => {
    const key = `${msg.jid}:${msg.sender}`;
    const session = sessions.get(key);

    if (msg.args[0] === "nyerah" && session) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      return msg.reply(t("game.hangman.surrender", { word: session.word }));
    }

    if (!msg.args[0]) {
      if (session)
        return msg.reply(
          t("game.hangman.status", {
            display: render(session.word, session.guessed),
            lives: session.lives,
            letters: [...session.guessed].join(", ") || "-",
          }),
        );
      const word = getRandomItem(words) as string;
      const jid = msg.jid;
      const timeout = setTimeout(() => {
        sessions.delete(key);
        sock.sendMessage(jid, { text: t("game.hangman.timeout", { word }) });
      }, 120_000);
      sessions.set(key, { word, guessed: new Set(), lives: 6, timeout });
      return msg.reply(
        t("game.hangman.start", { length: word.length, display: render(word, new Set()) }),
      );
    }

    if (!session) return msg.reply(t("game.hangman.noSession"));

    const letter = msg.args[0].toLowerCase();
    if (letter.length !== 1 || !/[a-z]/.test(letter))
      return msg.reply(t("game.hangman.invalidLetter"));
    if (session.guessed.has(letter)) return msg.reply(t("game.hangman.duplicateLetter"));

    session.guessed.add(letter);

    if (!session.word.includes(letter)) {
      session.lives--;
      if (session.lives <= 0) {
        clearTimeout(session.timeout);
        sessions.delete(key);
        return msg.reply(t("game.hangman.gameOver", { word: session.word }));
      }
    }

    const display = render(session.word, session.guessed);
    if (!display.includes("_")) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      addXp(msg.sender, 20);
      return msg.reply(t("game.hangman.win", { word: session.word }));
    }

    await msg.reply(
      t("game.hangman.progress", {
        display,
        lives: session.lives,
        letters: [...session.guessed].join(", "),
      }),
    );
  },
});
