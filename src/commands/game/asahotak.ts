import { defineCommand } from "@/core/types";
import { GameManager } from "@/game/game-helper";
import { getRandomItem, loadGameData } from "@/utils/helper";

const gm = new GameManager(15);

const localData = loadGameData<{ soal: string; jawaban: string }>("asahotak.json");

export default defineCommand({
  name: "Asah Otak",
  alias: ["ao", "asahotak"],
  description: "Brain teaser game (Type 'hint' for help)",
  handler: async (sock, msg) => {
    if (msg.args[0] === "hint") {
      const hint = gm.getHint(msg.jid);
      return msg.reply(hint ? `💡 Hint: *${hint}*` : "🚩 No active session!");
    }

    const item = getRandomItem(localData);
    const success = gm.start(msg.jid, item.jawaban, msg.sender, () => {
      sock.sendMessage(msg.jid, { text: `⏰ Time's up! The answer: *${item.jawaban}*` });
    });

    if (!success) return msg.reply("⏳ Finish the previous question first!");
    await msg.reply(`🧠 *Brain Teaser*

Question: ${item.soal}

Time 60s!
(Type *.asahotak hint*)`);
  },
});

export const checkAsahOtak = (jid: string, text: string, sender: string) => {
  const ans = gm.check(jid, text, sender);
  return ans ? `✅ Correct! The answer is *${ans.toUpperCase()}* (+15 XP)` : null;
};
