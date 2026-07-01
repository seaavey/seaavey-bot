import { t } from "@/core/translations";
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
  description: t("game.duel.desc"),
  handler: async (sock, msg) => {
    const key = msg.jid;
    const session = sessions.get(key);

    // Accept duel
    if (msg.args[0] === "accept" && session && session.target === msg.sender) {
      session.turn = session.challenger;
      return msg.reply(
        t("game.duel.start", {
          challenger: getNumber(session.challenger),
          target: getNumber(session.target),
        }),
      );
    }

    // Attack
    if (msg.args[0] === "attack" && session) {
      if (session.turn !== msg.sender) return msg.reply(t("game.duel.notYourTurn"));

      const dmg = getRandomNumber(10, 39);
      const opponent = msg.sender === session.challenger ? session.target : session.challenger;
      session.hp[opponent] = (session.hp[opponent] ?? 100) - dmg;

      if ((session.hp[opponent] ?? 0) <= 0) {
        clearTimeout(session.timeout);
        sessions.delete(key);
        addXp(msg.sender, 25);
        return msg.send({
          text: t("game.duel.win", { attacker: getNumber(msg.sender), dmg }),
          mentions: [msg.sender, opponent],
        });
      }

      session.turn = opponent;
      return msg.send({
        text: t("game.duel.attack", {
          attacker: getNumber(msg.sender),
          dmg,
          challenger: getNumber(session.challenger),
          challengerHp: session.hp[session.challenger],
          target: getNumber(session.target),
          targetHp: session.hp[session.target],
          next: getNumber(opponent),
        }),
        mentions: [session.challenger, session.target],
      });
    }

    // Start new duel
    if (session) return msg.reply(t("game.duel.existing"));
    const target = msg.mentioned[0] || msg.quoted?.sender;
    if (!target) return msg.reply(t("game.duel.mention"));
    if (target === msg.sender) return msg.reply(t("game.duel.self"));

    const jid = msg.jid;
    const timeout = setTimeout(() => {
      sessions.delete(key);
      sock.sendMessage(jid, { text: t("game.duel.timeout") });
    }, 120_000);
    sessions.set(key, {
      challenger: msg.sender,
      target,
      hp: { [msg.sender]: 100, [target]: 100 },
      turn: "",
      timeout,
    });

    await msg.send({
      text: t("game.duel.challenge", {
        challenger: getNumber(msg.sender),
        target: getNumber(target),
      }),
      mentions: [msg.sender, target],
    });
  },
});
