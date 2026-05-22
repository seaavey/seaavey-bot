import { config } from "@/core/config";
import { checkGameAnswer } from "@/game/game";
import type { MessageMiddleware } from "@/handlers/message-context";

export const gameAnswerMiddleware: MessageMiddleware = async (ctx) => {
  const { sock, raw, parse } = ctx;

  if (!parse.body || parse.body.startsWith(config.prefix)) return "next";

  const gameResult = checkGameAnswer(parse.jid, parse.body, parse.sender);
  if (gameResult) {
    await sock.sendMessage(parse.jid, { text: gameResult }, { quoted: raw });
    return "stop";
  }
  return "next";
};
