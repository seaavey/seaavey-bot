import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";

const sessions = new Map<string, { lastWord: string; used: Set<string>; timeout: Timer }>();

export default defineCommand({
  name: "Word Chain",
  alias: ["wc", "wordchain"],
  description: "Word chain (last letter = first letter)",
  handler: async (sock, msg) => {
    const session = sessions.get(msg.jid);
    const word = msg.args[0]?.toLowerCase();

    if (!word) {
      if (session)
        return msg.reply(
          `🔗 Last word: *${session.lastWord}*
Connect with letter *${session.lastWord.slice(-1).toUpperCase()}*

Type .wordchain [word]`,
        );
      const jid = msg.jid;
      const timeout = setTimeout(() => {
        const s = sessions.get(jid);
        sessions.delete(jid);
        sock.sendMessage(jid, {
          text: `⏰ Time's up! Word Chain ended. Total ${s?.used.size ?? 0} words.`,
        });
      }, 120_000);
      sessions.set(msg.jid, { lastWord: "indonesia", used: new Set(["indonesia"]), timeout });
      return msg.reply(
        "🔗 *Word Chain* started!\n\nFirst word: *indonesia*\nContinue with letter *A*\n\nType .wordchain [word]",
      );
    }

    if (!session) return msg.reply("Type .wordchain to start a new game.");

    if (word === "nyerah") {
      clearTimeout(session.timeout);
      sessions.delete(msg.jid);
      return msg.reply(`🏳️ Giving up! Total ${session.used.size} words.`);
    }

    if (word.length < 3) return msg.reply("🚩 Minimum 3 letters!");
    if (session.used.has(word)) return msg.reply("🚩 Word already used!");
    if (word[0] !== session.lastWord.slice(-1)) {
      return msg.reply(`🚩 Must start with letter *${session.lastWord.slice(-1).toUpperCase()}*!`);
    }

    session.used.add(word);
    session.lastWord = word;
    clearTimeout(session.timeout);
    const jid = msg.jid;
    session.timeout = setTimeout(() => {
      const s = sessions.get(jid);
      sessions.delete(jid);
      sock.sendMessage(jid, {
        text: `⏰ Time's up! Word Chain ended. Total ${s?.used.size ?? 0} words.`,
      });
    }, 120_000);

    addXp(msg.sender, 3);
    await msg.reply(`✅ *${word}* (+3 XP)

Connect with letter *${word.slice(-1).toUpperCase()}*`);
  },
});
