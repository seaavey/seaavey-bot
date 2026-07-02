import { config } from "@/core/config";
import { checkGameAnswer } from "@/game/game";
import type { MessageMiddleware } from "@/handlers/message-context";

export const gameAnswerMiddleware: MessageMiddleware = async (ctx) => {
  const { sock, raw, parse } = ctx;

  const hasPrefix = config.prefix.some((p) => parse.body.startsWith(p));
  if (!parse.body || hasPrefix) return "next";

  const gameResult = await checkGameAnswer(parse.jid, parse.body, parse.sender);
  if (gameResult) {
    await sock.sendMessage(parse.jid, { text: gameResult }, { quoted: raw });
    return "stop";
  }
  return "next";
};
