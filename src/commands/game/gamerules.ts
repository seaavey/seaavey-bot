import { config } from "@/core/config";
import { defineCommand } from "@/core/types";

const p = config.prefix[0] || ".";

export default defineCommand({
  name: "Game Rules",
  alias: ["grules", "gamerules"],
  description: "List of game rules and instructions",
  handler: async (_sock, msg) => {
    const text = [
      "🎮 *SEAAVEYBOT GAME RULES*",
      "",
      "• *Math*: Bot sends math question. Answer directly in chat (no prefix). 30 second limit.",
      "• *Susunkata*: Arrange random letters into the correct word. Answer directly in chat (no prefix).",
      "• *Tebakkata*: Bot sends general knowledge question. Answer directly in chat (no prefix).",
      "• *Tebakbendera*: Guess the country from the flag emoji. Answer directly in chat (no prefix).",
      "• *Tebakanime*: Guess the anime from the image. Answer directly in chat (no prefix).",
      `• *Family 100*: Group only. Guess all survey answers. Answer directly in group (no prefix).`,
      `• *Tebakangka*: Start by typing command without number. Guess with ${p}tebakangka [1-100]. Give up with ${p}tebakangka surrender. Max 10 attempts / 120 seconds.`,
      `• *Quiz*: Bot sends multiple choice question. Answer with ${p}quiz A/B/C/D.`,
      `• *Hangman*: Guess letters one by one. Answer with ${p}hangman [letter]. Give up with ${p}hangman surrender. 6 lives / 120 seconds.`,
      `• *TicTacToe*: Play against bot. Move with ${p}tictactoe [1-9]. Give up with ${p}tictactoe surrender.`,
      `• *Wordchain*: Word chain: first letter must match the last letter of the previous word. Answer with ${p}wordchain [word]. Give up with ${p}wordchain surrender. Min 3 letters / 120s per turn.`,
      "• *Tebakkabupaten*: Guess the regency/city from the regional emblem image. Answer directly in chat (no prefix).",
      "• *Tebakkimia*: Guess chemical element symbol from the element name. Answer directly in chat (no prefix).",
      "• *Tekateki*: Answer funny riddles. Answer directly in chat (no prefix).",
      `• *Slot/Dice/Coinflip/Suit*: Game of chance commands. Try ${p}slot, ${p}dice [1-6], ${p}coinflip heads/tails, ${p}suit batu/gunting/kertas.`,
      "",
      `💡 See all game commands: ${p}menu game`,
      `💡 See rules again: ${p}gamerules`,
    ].join("\n");

    await msg.reply(text);
  },
});
