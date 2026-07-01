import { defineCommand } from "@/core/types";
import { getNumber, getRandomNumber } from "@/utils/helper";

export default defineCommand({
  name: "Ship",
  alias: ["ship"],
  description: "Check compatibility between two users",
  handler: async (_sock, msg) => {
    const a = msg.mentioned[0];
    const b = msg.mentioned[1];
    if (!a || !b) return msg.reply("Format: .ship @user1 @user2");

    const pct = getRandomNumber(0, 100);
    let verdict = "Not compatible 💔";
    if (pct > 80) {
      verdict = "PERFECT MATCH! 💕";
    } else if (pct > 60) {
      verdict = "Very compatible~ 💗";
    } else if (pct > 40) {
      verdict = "Not bad 💛";
    } else if (pct > 20) {
      verdict = "Hmm not quite compatible 😅";
    }

    await msg.send({
      text: `💕 *Ship Result*

@${getNumber(a)} ❤️ @${getNumber(b)}

Match: ${pct}%
_${verdict}_`,
      mentions: [a, b],
    });
  },
});
