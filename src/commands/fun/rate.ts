import { getNumber, getRandomItem, getRandomNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const categories = [
  "Kegantengan",
  "Kecantikan",
  "Keberuntungan",
  "Kejeniusan",
  "Kemalasan",
  "Kesabaran",
  "Kebaikan hati",
  "Kegabutan",
];

export default defineCommand({
  name: "rate",
  description: "Rate seseorang secara random",
  handler: async (_sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted || msg.sender;
    const cat = getRandomItem(categories);
    const score = getRandomNumber(0, 100);
    await msg.send({
      text: `⭐ *Rate*\n\n👤 @${getNumber(target)}\n📊 ${cat}: *${score}/100*`,
      mentions: [target],
    });
  },
});
