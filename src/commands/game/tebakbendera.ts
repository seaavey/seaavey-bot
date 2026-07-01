import { defineCommand } from "@/core/types";
import { GameManager } from "@/game/game-helper";
import { getRandomItem, loadGameData } from "@/utils/helper";

const gm = new GameManager(50);

const localData = loadGameData<{ flag: string; img: string; name: string }>("tebakbendera.json");

export default defineCommand({
  name: "Tebak Bendera",
  alias: ["tbb", "bendera", "tebakbendera"],
  description: "Guess the country from the flag image (Type 'hint' for help)",
  handler: async (sock, msg) => {
    if (msg.args[0] === "hint") {
      const hint = gm.getHint(msg.jid);
      return msg.reply(hint ? `💡 Hint: *${hint}*` : "🚩 No active session!");
    }

    const item = getRandomItem(localData);
    const success = gm.start(msg.jid, item.name, msg.sender, () => {
      sock.sendMessage(msg.jid, { text: `⏰ Time's up! The answer: *${item.name}*` });
    });

    if (!success) return msg.reply("⏳ Finish the previous question first!");
    await msg.send({
      image: { url: item.img },
      caption:
        "🏁 *Guess the Flag!*\n\nWhat country is this?\n\nTime 60s!\n(Type *.tebakbendera hint*)",
    });
  },
});

export const checkTebakBendera = (jid: string, text: string, sender: string) => {
  const ans = gm.check(jid, text, sender);
  return ans ? `✅ Correct! The answer is *${ans}* (+50 XP)` : null;
};
