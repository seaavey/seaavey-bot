import { defineCommand } from "@/core/types";
import { getRandomItem } from "@/utils/helper";

const truths = [
  "Who is the last person you stalked on social media?",
  "What is the biggest secret you have never told anyone?",
  "Who is your current crush?",
  "What is the most embarrassing thing you have ever done?",
  "What is the biggest lie you have told your parents?",
  "Who in this group do you like the most?",
  "What is a weird habit of yours that nobody knows about?",
  "What is the last movie or anime that made you cry?",
  "What is your biggest insecurity?",
  "Which ex do you miss the most?",
];

const dares = [
  "Send a voice note singing a children's song!",
  "Change your profile picture to a meme for 1 hour!",
  "Send 'I miss you' to the last person you chatted with!",
  "Send a voice note screaming 'I AM BEAUTIFUL/HANDSOME' as loud as you can!",
  "Send the most cringe sticker you have!",
  "Reply to a random person's status/story saying 'Hey beautiful/handsome'!",
  "Change your WhatsApp bio to 'I am single and need affection' for 1 hour!",
  "Send a selfie without any filters right now!",
  "Send a voice note of you laughing for 10 seconds!",
  "Tag an admin and say 'You are so handsome/beautiful'!",
];

export default defineCommand({
  name: "Truth or Dare",
  alias: ["truthordare", "tod"],
  description: "Play a random game of Truth or Dare",
  handler: async (_sock, msg) => {
    const type = msg.args[0]?.toLowerCase();
    if (type === "truth" || type === "t") {
      const q = getRandomItem(truths);
      return msg.reply(`🤫 *Truth*

${q}`);
    }
    if (type === "dare" || type === "d") {
      const q = getRandomItem(dares);
      return msg.reply(`😈 *Dare*

${q}`);
    }
    const isTruth = Math.random() > 0.5;
    const pool = isTruth ? truths : dares;
    const q = getRandomItem(pool);
    await msg.reply(
      `🎲 *Truth or Dare (${isTruth ? "Truth" : "Dare"})*

${q}`,
    );
  },
});
