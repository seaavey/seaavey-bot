import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";
import { getNumber, getRandomNumber } from "@/utils/helper";

const sessions = new Map<
  string,
  { challenger: string; target: string; hp: Record<string, number>; turn: string; timeout: Timer }
>();

export default defineCommand({
  name: "Duel",
  alias: ["duel"],
  description: "Duel against another player",
  handler: async (sock, msg) => {
    const key = msg.jid;
    const session = sessions.get(key);

    // Accept duel
    if (msg.args[0] === "accept" && session && session.target === msg.sender) {
      session.turn = session.challenger;
      return msg.reply(
        `⚔️ The duel has begun! @${getNumber(session.challenger)} vs @${getNumber(session.target)}

It is @${getNumber(session.challenger)}'s turn first! Type .duel attack`,
      );
    }

    // Attack
    if (msg.args[0] === "attack" && session) {
      if (session.turn !== msg.sender) return msg.reply("🚩 Not your turn!");

      const dmg = getRandomNumber(10, 39);
      const opponent = msg.sender === session.challenger ? session.target : session.challenger;
      session.hp[opponent] = (session.hp[opponent] ?? 100) - dmg;

      if ((session.hp[opponent] ?? 0) <= 0) {
        clearTimeout(session.timeout);
        sessions.delete(key);
        addXp(msg.sender, 25);
        return msg.send({
          text: `🏆 @${getNumber(msg.sender)} has won the duel! (+25 XP)`,
          mentions: [msg.sender, opponent],
        });
      }

      session.turn = opponent;
      return msg.send({
        text: `⚔️ @${getNumber(msg.sender)} attacks and deals *${dmg}* damage!

• @${getNumber(session.challenger)}: HP ${session.hp[session.challenger]}
• @${getNumber(session.target)}: HP ${session.hp[session.target]}

Next turn: @${getNumber(opponent)} (Type .duel attack)`,
        mentions: [session.challenger, session.target],
      });
    }

    // Start new duel
    if (session) return msg.reply("⏳ There's already a duel in progress!");
    const target = msg.mentioned[0] || msg.quoted?.sender;
    if (!target) return msg.reply("Tag your opponent: .duel @user");
    if (target === msg.sender) return msg.reply("🚩 Can't duel yourself!");

    const jid = msg.jid;
    const timeout = setTimeout(() => {
      sessions.delete(key);
      sock.sendMessage(jid, { text: "⏰ Time's up! Duel canceled." });
    }, 120_000);
    sessions.set(key, {
      challenger: msg.sender,
      target,
      hp: { [msg.sender]: 100, [target]: 100 },
      turn: "",
      timeout,
    });

    await msg.send({
      text: `⚔️ @${getNumber(msg.sender)} has challenged @${getNumber(target)} to a duel!

Type .duel accept to accept (120 seconds)`,
      mentions: [msg.sender, target],
    });
  },
});
