import { defineCommand } from "@/core/types";
import { getRandomItem } from "@/utils/helper";

const quotes = [
  "Life is like riding a bicycle. To keep your balance, you must keep moving. — Albert Einstein",
  "The only way to do great work is to love what you do. — Steve Jobs",
  "Don't wait. The time will never be just right. — Napoleon Hill",
  "Success is a lousy teacher. It seduces smart people into thinking they can't lose. — Bill Gates",
  "Education is the most powerful weapon which you can use to change the world. — Nelson Mandela",
  "Be the change that you wish to see in the world. — Mahatma Gandhi",
  "Failure is the condiment that gives success its flavor. — Truman Capote",
  "A dream doesn't become reality through magic. It takes sweat, determination, and hard work. — Colin Powell",
  "Don't be afraid to fail. Be afraid not to try. — Michael Jordan",
  "The best time to plant a tree was 20 years ago. The second best time is now. — Chinese Proverb",
  "A person who never made a mistake never tried anything new. — Albert Einstein",
  "It's not about how hard you hit, it's about how hard you can get hit and keep moving forward. — Rocky Balboa",
];

export default defineCommand({
  name: "Quotes",
  alias: ["qts", "quotes"],
  description: "Get a random motivational quote",
  handler: async (_sock, msg) => {
    const q = getRandomItem(quotes);
    await msg.reply(`💬 *Quote*

${q}`);
  },
});
