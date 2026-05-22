import type { MessageMiddleware } from "@/handlers/message-context";
import { getNumber } from "@/utils/helper";

export const antiLink: MessageMiddleware = async (ctx) => {
  const { sock, raw, parse, group } = ctx;
  if (!parse.isGroup || !group?.antilink) return "next";
  if (parse.isAdmin) return "next";
  if (!/https?:\/\/\S+/i.test(parse.body)) return "next";

  await sock.sendMessage(parse.jid, { delete: raw.key });
  await sock.sendMessage(parse.jid, {
    text: `⚠️ @${getNumber(parse.sender)} link tidak diperbolehkan!`,
    mentions: [parse.sender],
  });
  return "stop";
};
