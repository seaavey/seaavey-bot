import { defineCommand } from "@/core/types";
import { GameManager } from "@/game/game-helper";
import { getRandomItem, loadGameData } from "@/utils/helper";

const gm = new GameManager(30);

const localData = loadGameData<{ soal: string; jawaban: string; deskripsi: string }>(
  "caklontong.json",
);

export default defineCommand({
  name: "Cak Lontong",
  alias: ["cl", "caklontong"],
  description: "Cak Lontong puzzle game (Type 'hint' for help)",
  handler: async (sock, msg) => {
    if (msg.args[0] === "hint") {
      const hint = gm.getHint(msg.jid);
      return msg.reply(hint ? `💡 Hint: *${hint}*` : "🚩 No active session!");
    }

    const item = getRandomItem(localData);
    const success = gm.start(msg.jid, item.jawaban, msg.sender, () => {
      sock.sendMessage(msg.jid, {
        text: `⏰ Time's up! The answer: *${item.jawaban}*\nDescription: ${item.deskripsi}`,
      });
    });

    if (!success) return msg.reply("⏳ Finish the previous question first!");
    await msg.reply(`🧩 *Cak Lontong Puzzle*

Question: ${item.soal}

Time 60s!
(Type *.caklontong hint*)`);
  },
});

export const checkCakLontong = (jid: string, text: string, sender: string) => {
  const ans = gm.check(jid, text, sender);
  return ans ? "✅ Correct! (+30 XP)" : null;
};
