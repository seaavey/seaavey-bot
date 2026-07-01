import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";

const sessions = new Map<string, { lastWord: string; used: Set<string>; timeout: Timer }>();

export default defineCommand({
  name: "Word Chain",
  alias: ["wc", "wordchain"],
  description: t("game.wordchain.desc"),
  handler: async (sock, msg) => {
    const session = sessions.get(msg.jid);
    const word = msg.args[0]?.toLowerCase();

    if (!word) {
      if (session)
        return msg.reply(
          t("game.wordchain.status", {
            word: session.lastWord,
            letter: session.lastWord.slice(-1).toUpperCase(),
          }),
        );
      const jid = msg.jid;
      const timeout = setTimeout(() => {
        const s = sessions.get(jid);
        sessions.delete(jid);
        sock.sendMessage(jid, {
          text: t("game.wordchain.timeout", { count: s?.used.size ?? 0 }),
        });
      }, 120_000);
      sessions.set(msg.jid, { lastWord: "indonesia", used: new Set(["indonesia"]), timeout });
      return msg.reply(t("game.wordchain.start"));
    }

    if (!session) return msg.reply(t("game.wordchain.noSession"));

    if (word === "nyerah") {
      clearTimeout(session.timeout);
      sessions.delete(msg.jid);
      return msg.reply(t("game.wordchain.surrender", { count: session.used.size }));
    }

    if (word.length < 3) return msg.reply(t("game.wordchain.tooShort"));
    if (session.used.has(word)) return msg.reply(t("game.wordchain.used"));
    if (word[0] !== session.lastWord.slice(-1)) {
      return msg.reply(
        t("game.wordchain.wrongLetter", { letter: session.lastWord.slice(-1).toUpperCase() }),
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
        text: t("game.wordchain.timeout", { count: s?.used.size ?? 0 }),
      });
    }, 120_000);

    addXp(msg.sender, 3);
    await msg.reply(t("game.wordchain.correct", { word, letter: word.slice(-1).toUpperCase() }));
  },
});
