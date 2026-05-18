import { addXp } from "@/infra/database";
import { getNumber, getRandomNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const sessions = new Map<
  string,
  { challenger: string; target: string; hp: Record<string, number>; turn: string; timeout: Timer }
>();

export default defineCommand({
  name: "duel",
  description: "Duel lawan player lain",
  handler: async (sock, msg) => {
    const key = msg.jid;
    const session = sessions.get(key);

    // Accept duel
    if (msg.args[0] === "accept" && session && session.target === msg.sender) {
      session.turn = session.challenger;
      return msg.reply(
        `⚔️ Duel dimulai!\n\n@${getNumber(session.challenger)} vs @${getNumber(session.target)}\n\nGiliran @${getNumber(session.challenger)}! Ketik .duel attack`,
      );
    }

    // Attack
    if (msg.args[0] === "attack" && session) {
      if (session.turn !== msg.sender) return msg.reply("❌ Bukan giliranmu!");

      const dmg = getRandomNumber(10, 39);
      const opponent = msg.sender === session.challenger ? session.target : session.challenger;
      session.hp[opponent] = (session.hp[opponent] ?? 100) - dmg;

      if ((session.hp[opponent] ?? 0) <= 0) {
        clearTimeout(session.timeout);
        sessions.delete(key);
        addXp(msg.sender, 25);
        return msg.send({
          text: `⚔️ @${getNumber(msg.sender)} menyerang ${dmg} damage!\n\n🏆 @${getNumber(msg.sender)} menang! (+25 XP)`,
          mentions: [msg.sender, opponent],
        });
      }

      session.turn = opponent;
      return msg.send({
        text: `⚔️ @${getNumber(msg.sender)} menyerang ${dmg} damage!\n\n❤️ @${getNumber(session.challenger)}: ${session.hp[session.challenger]} HP\n❤️ @${getNumber(session.target)}: ${session.hp[session.target]} HP\n\nGiliran @${getNumber(opponent)}! Ketik .duel attack`,
        mentions: [session.challenger, session.target],
      });
    }

    // Start new duel
    if (session) return msg.reply("⏳ Masih ada duel yang berlangsung!");
    const target = msg.mentioned[0] || msg.quoted;
    if (!target) return msg.reply("Tag lawan: .duel @user");
    if (target === msg.sender) return msg.reply("❌ Gak bisa duel sendiri!");

    const jid = msg.jid;
    const timeout = setTimeout(() => {
      sessions.delete(key);
      sock.sendMessage(jid, { text: "⏰ Waktu habis! Duel dibatalkan." });
    }, 120_000);
    sessions.set(key, {
      challenger: msg.sender,
      target,
      hp: { [msg.sender]: 100, [target]: 100 },
      turn: "",
      timeout,
    });

    await msg.send({
      text: `⚔️ @${getNumber(msg.sender)} menantang @${getNumber(target)}!\n\nKetik .duel accept untuk menerima (120 detik)`,
      mentions: [msg.sender, target],
    });
  },
});
