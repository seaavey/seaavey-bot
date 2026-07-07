import type { MessageMiddleware } from "@/handlers/message-context";
import { getNumber } from "@/utils/helper";
import { TtlMap } from "@/utils/ttl-map";

const spamTracker = new TtlMap<string, number[]>(15_000);

export const antiSpam: MessageMiddleware = async (ctx) => {
  const { sock, parse, group } = ctx;
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
    await sock.sendMessage(parse.jid, { delete: parse.key });
    await sock.sendMessage(parse.jid, {
      text: `⚠️ @${getNumber(parse.sender)} don't spam!`,
      mentions: [parse.sender],
    });
    return "stop";
  }
  return "next";
};
