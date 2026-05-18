import { getNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const votes = new Map<string, { target: string; voters: Set<string>; timeout: Timer }>();

export default defineCommand({
  name: "votekick",
  description: "Vote untuk kick member. Butuh 5 vote.",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya untuk group.");
    if (!msg.isBotAdmin) return msg.reply("❌ Bot harus jadi admin.");
    const target = msg.mentioned[0] || msg.quoted;
    if (!target) return msg.reply("Tag user yang ingin di-votekick.\nContoh: .votekick @user");
    if (target === msg.sender) return msg.reply("❌ Gak bisa votekick diri sendiri.");

    const key = `${msg.jid}:${target}`;
    let session = votes.get(key);

    if (!session) {
      const jid = msg.jid;
      const _lid = msg.jid;
      const timeout = setTimeout(() => {
        votes.delete(key);
        sock.sendMessage(jid, {
          text: `⏰ Votekick @${getNumber(target)} expired.`,
          mentions: [target],
        });
      }, 300_000);
      session = { target, voters: new Set(), timeout };
      votes.set(key, session);
    }

    if (session.voters.has(msg.sender)) return msg.reply("❌ Kamu sudah vote!");
    session.voters.add(msg.sender);
    const needed = 5;

    if (session.voters.size >= needed) {
      clearTimeout(session.timeout);
      votes.delete(key);
      await sock.groupParticipantsUpdate(msg.jid, [target], "remove");
      return msg.send({
        text: `🗳️ *Votekick Berhasil!*\n\n@${getNumber(target)} dikick (${needed}/${needed} vote)`,
        mentions: [target],
      });
    }

    await msg.send({
      text: `🗳️ *Votekick*\n\n@${getNumber(target)} — ${session.voters.size}/${needed} vote\n\nKetik .votekick @${getNumber(target)} untuk vote!`,
      mentions: [target],
    });
  },
});
