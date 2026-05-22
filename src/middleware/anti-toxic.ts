import { config } from "@/core/config";
import type { MessageMiddleware } from "@/handlers/message-context";
import { isToxicMessage } from "@/infra/repositories/toxic-repo";
import { getNumber } from "@/utils/helper";

export const antiToxic: MessageMiddleware = async (ctx) => {
  const { sock, raw, parse, group } = ctx;
  if (!parse.isGroup || !group?.antitoxic) return "next";
  if (parse.isAdmin) return "next";

  const customToxic = isToxicMessage(parse.jid, parse.body);
  if (!config.toxicRegex.test(parse.body) && !customToxic) return "next";

  await sock.sendMessage(parse.jid, { delete: raw.key });
  await sock.sendMessage(parse.jid, {
    text: `⚠️ @${getNumber(parse.sender)} jaga bicaramu!`,
    mentions: [parse.sender],
  });
  return "stop";
};
