import type { WASocket } from "baileys";
import { defineCommand } from "@/core/types";
import { t } from "@/core/translations";
import { getNumber } from "@/utils/helper";

const votes = new Map<string, { target: string; voters: Set<string>; timeout: Timer }>();

function getSession(key: string, target: string, sock: WASocket, jid: string) {
  let session = votes.get(key);
  if (session) return session;

  const timeout = setTimeout(() => {
    votes.delete(key);
    sock.sendMessage(jid, {
      text: t("group.votekick.expired", { target: getNumber(target) }),
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
  description: t("group.votekick.description"),
  groupOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender;
    if (!target) return msg.reply(t("group.votekick.noTarget"));
    if (target === msg.sender) return msg.reply(t("group.votekick.self"));

    const key = `${msg.jid}:${target}`;
    const session = getSession(key, target, sock, msg.jid);

    if (session.voters.has(msg.sender)) return msg.reply(t("group.votekick.alreadyVoted"));
    session.voters.add(msg.sender);
    const needed = 5;

    if (session.voters.size >= needed) {
      clearTimeout(session.timeout);
      votes.delete(key);
      await sock.groupParticipantsUpdate(msg.jid, [target], "remove");
      return msg.send({
        text: t("group.votekick.success", { target: getNumber(target), needed }),
        mentions: [target],
      });
    }

    await msg.send({
      text: t("group.votekick.progress", {
        target: getNumber(target),
        count: session.voters.size,
        needed,
      }),
      mentions: [target],
    });
  },
});
