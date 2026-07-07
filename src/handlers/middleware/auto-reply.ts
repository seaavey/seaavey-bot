import { config } from "@/core/config";
import type { MessageMiddleware } from "@/handlers/message-context";
import { findAutoReply } from "@/infra/repositories/autoreply-repo";

export const autoReplyMiddleware: MessageMiddleware = async (ctx) => {
  const { parse } = ctx;

  const hasPrefix = config.prefix.some((p) => parse.body.startsWith(p));
  if (!parse.body || hasPrefix) return "next";
  if (!parse.isGroup) return "next";

  const autoReply = findAutoReply(parse.jid, parse.body);
  if (autoReply) {
    await parse.reply(autoReply.response);
  }
  return "next";
};
