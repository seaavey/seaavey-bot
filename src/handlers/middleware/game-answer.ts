import { checkGameAnswer } from "@/game/game";
import type { MessageMiddleware } from "@/handlers/message-context";

export const gameAnswerMiddleware: MessageMiddleware = async (ctx) => {
  const { parse } = ctx;

  if (!parse.body || parse.isCommand) return "next";

  const gameResult = await checkGameAnswer(parse.jid, parse.body, parse.sender);
  if (gameResult) {
    await parse.reply(gameResult);
    return "stop";
  }
  return "next";
};
