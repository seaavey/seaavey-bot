import { defineCommand } from "@/core/types";
import { getRandomItem } from "@/utils/helper";

const fakta = [
  "Octopuses have 3 hearts and their blood is blue.",
  "Honey never spoils. Honey found in ancient Egyptian tombs is still edible.",
  "Koala fingerprints are almost identical to human fingerprints.",
  "Bananas are technically berries, but strawberries are not.",
  "Shrimp hearts are located in their heads.",
  "A day on Venus is longer than a year on Venus.",
  "Humans share 60% of their DNA with bananas.",
  "Dolphins sleep with one eye open.",
  "Honeybees can recognize human faces.",
  "The strongest muscle in the human body is the tongue.",
  "Cats cannot taste sweetness.",
  "Astronauts grow about 5cm taller in space.",
  "The human brain uses 20% of the body's total energy.",
  "There are more stars in the universe than grains of sand on Earth.",
  "Cockroaches can live without their head for a week.",
];

export default defineCommand({
  name: "Fakta",
  alias: ["fakta"],
  description: "Random interesting facts",
  handler: async (_sock, msg) => {
    const f = getRandomItem(fakta);
    await msg.reply(`📌 *Random Fact*

${f}`);
  },
});
