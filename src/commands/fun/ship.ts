import { getNumber, getRandomNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";
export default defineCommand({
  name: "ship",
  description: "Cek kecocokan 2 orang. Tag 2 user.",
  handler: async (_sock, msg) => {
    const a = msg.mentioned[0];
    const b = msg.mentioned[1];
    if (!a || !b) return msg.reply("Tag 2 orang!\nContoh: .ship @user1 @user2");
    const pct = getRandomNumber(0, 100);
    const bar = "❤️".repeat(Math.floor(pct / 10)) + "🖤".repeat(10 - Math.floor(pct / 10));
    let verdict = "Gak cocok 💔";
    if (pct > 80) verdict = "JODOH BANGET! 💕";
    else if (pct > 60) verdict = "Cocok nih~ 💗";
    else if (pct > 40) verdict = "Lumayan lah 💛";
    else if (pct > 20) verdict = "Hmm kurang cocok 😅";
    await msg.send({
      text: `💘 *Love Calculator*\n\n@${getNumber(a)} ❤️ @${getNumber(b)}\n\n${bar}\n*${pct}%* — ${verdict}`,
      mentions: [a, b],
    });
  },
});
