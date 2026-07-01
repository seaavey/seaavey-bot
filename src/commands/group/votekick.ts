import type { WASocket } from "baileys";
import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";

const votes = new Map<string, { target: string; voters: Set<string>; timeout: Timer }>();

function getSession(key: string, target: string, sock: WASocket, jid: string) {
  let session = votes.get(key);
  if (session) return session;

  const timeout = setTimeout(() => {
    votes.delete(key);
    sock.sendMessage(jid, {
      text: "⏰ Time's up! Votekick cancelled.",
      mentions: [target],
    });
  }, 300_000);

  session = { target, voters: new Set(), timeout };
  votes.set(key, session);
  return session;
}

export default defineCommand({
  name: "Vote Kick",
  alias: ["vk", "votekick"],
  description: "Vote to kick a member. Needs 5 votes.",
  groupOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender;
    if (!target) return msg.reply("Tag the user you want to votekick.\nExample: .votekick @user");
    if (target === msg.sender) return msg.reply("🚩 Can't votekick yourself.");

    const key = `${msg.jid}:${target}`;
    const session = getSession(key, target, sock, msg.jid);

    if (session.voters.has(msg.sender)) return msg.reply("🚩 You have already voted!");
    session.voters.add(msg.sender);
    const needed = 5;

    if (session.voters.size >= needed) {
      clearTimeout(session.timeout);
      votes.delete(key);
      await sock.groupParticipantsUpdate(msg.jid, [target], "remove");
      return msg.send({
        text: `🗳️ *Votekick Successful!*

@${getNumber(target)} kicked (${votes}/${needed} votes)`,
        mentions: [target],
      });
    }

    await msg.send({
      text: `🗳️ *Votekick*

@${getNumber(target)} — ${votes}/${needed} votes

Type .votekick @${getNumber(target)} to vote!`,
      mentions: [target],
    });
  },
});
