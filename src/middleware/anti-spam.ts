import type { MessageMiddleware } from "@/handlers/message-context";
import { getNumber } from "@/utils/helper";

const spamTracker = new Map<string, number[]>();

export const antiSpam: MessageMiddleware = async (ctx) => {
  const { sock, raw, parse, group } = ctx;
  if (!parse.isGroup || !group?.antispam) return "next";
  if (parse.isAdmin) return "next";

  const key = `${parse.jid}:${parse.sender}`;
  const now = Date.now();
  const timestamps = spamTracker.get(key) || [];
  timestamps.push(now);
  const recent = timestamps.filter((t) => now - t < 10_000);
  spamTracker.set(key, recent);

  if (recent.length >= 5) {
    spamTracker.delete(key);
    await sock.sendMessage(parse.jid, { delete: raw.key });
    await sock.sendMessage(parse.jid, {
      text: `⚠️ @${getNumber(parse.sender)} jangan spam!`,
      mentions: [parse.sender],
    });
    return "stop";
  }
  return "next";
};
