import { defineCommand } from "@/core/types";
import { getNumber, getRandomItem, getRandomNumber } from "@/utils/helper";

const categories = ["handsome", "beautiful", "smart", "wibu", "noob", "pro", "sadboy", "sadgirl"];

export default defineCommand({
  name: "Rate",
  alias: ["rate"],
  description: "Rate someone randomly",
  handler: async (_sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender || msg.sender;
    const cat = getRandomItem(categories);
    const score = getRandomNumber(0, 100);

    let emoji: string;
    if (score >= 85) {
      emoji = "🔥";
    } else if (score >= 60) {
      emoji = "😊";
    } else if (score >= 35) {
      emoji = "😐";
    } else {
      emoji = "💀";
    }

    await msg.send({
      text: `🎯 *Rate @${getNumber(target)} for ${cat}*\n\n${emoji} ${score}/100`,
      mentions: [target],
    });
  },
});
