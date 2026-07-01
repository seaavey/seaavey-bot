import { defineCommand } from "@/core/types";
import { getRandomItem } from "@/utils/helper";

const zodiak: Record<string, string[]> = {
  aries: [
    "Your energy is high today! Perfect for starting new projects.",
    "Don't be too stubborn today.",
    "A surprise is coming from someone you care about.",
  ],
  taurus: [
    "Your finances are stable today. Don't be wasteful!",
    "Time to enjoy the little things.",
    "Someone is secretly paying attention to you.",
  ],
  gemini: [
    "Your communication is excellent today. Make use of it!",
    "Don't overthink things.",
    "Good news from an old friend is on the way.",
  ],
  cancer: [
    "Make time for family today.",
    "You might feel sensitive today, keep your emotions in check.",
    "Good fortune will come from an unexpected direction.",
  ],
  leo: [
    "You are the center of attention today!",
    "Be confident, but don't be arrogant.",
    "An exciting career opportunity awaits.",
  ],
  virgo: [
    "Small details could be the key to success today.",
    "Try not to be too perfectionist.",
    "Pay attention to your health.",
  ],
  libra: [
    "A perfect day for socializing.",
    "An important decision awaits, think it through carefully.",
    "Love is on your side today.",
  ],
  scorpio: [
    "Trust your sharp intuition today.",
    "Don't hold onto grudges.",
    "A mystery is about to be revealed.",
  ],
  sagitarius: [
    "Adventure awaits! Don't be afraid to try new things.",
    "Your optimism is contagious to others.",
    "Learning something new will bring you luck.",
  ],
  capricorn: [
    "Your hard work will pay off.",
    "Don't forget to take a break.",
    "Someone admires your dedication.",
  ],
  aquarius: [
    "Your creative ideas are flowing today.",
    "Don't be afraid to stand out.",
    "A new friend will bring a fresh perspective.",
  ],
  pisces: [
    "Your imagination is high today, channel it into your work!",
    "Try not to daydream too much.",
    "A message is waiting for you in your dreams.",
  ],
};

export default defineCommand({
  name: "Zodiak",
  alias: ["zod", "zodiak"],
  description: "Check your zodiac prediction",
  handler: async (_sock, msg) => {
    const sign = msg.args[0]?.toLowerCase();
    if (!sign || !zodiak[sign]) {
      const list = Object.keys(zodiak).join(", ");
      return msg.reply(`Format: .zodiak <zodiac_name>\n\nAvailable signs: ${list}`);
    }
    const predictions = zodiak[sign];
    const pred = getRandomItem(predictions);
    await msg.reply(
      `🔮 *${sign.toUpperCase()} Horoscope*

${pred}`,
    );
  },
});
