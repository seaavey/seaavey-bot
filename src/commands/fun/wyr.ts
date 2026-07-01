import { defineCommand } from "@/core/types";
import { getRandomItem } from "@/utils/helper";

const questions = [
  { a: "Be able to fly but not swim", b: "Be able to swim but not walk" },
  { a: "Be rich with no friends", b: "Be poor with many friends" },
  { a: "Be able to read minds", b: "Be able to see the future" },
  { a: "Live without music forever", b: "Live without movies/series forever" },
  { a: "Always speak the truth", b: "Always tell lies" },
  { a: "Be invisible", b: "Be able to teleport" },
  { a: "Never use a phone again", b: "Never eat your favorite food again" },
  { a: "Live in the mountains alone", b: "Live in a super crowded city" },
  { a: "Have time but no money", b: "Have money but no time" },
  { a: "Be able to speak with animals", b: "Be able to speak all human languages" },
  { a: "Live in the Harry Potter universe", b: "Live in the Marvel universe" },
  { a: "Be the smartest person", b: "Be the luckiest person" },
];

export default defineCommand({
  name: "Would You Rather",
  alias: ["wouldyourather"],
  description: "Play Would You Rather game",
  handler: async (_sock, msg) => {
    const q = getRandomItem(questions) as (typeof questions)[number];
    await msg.reply(`🤔 *Would You Rather*

A: ${q.a}
B: ${q.b}

Choose A or B!`);
  },
});
