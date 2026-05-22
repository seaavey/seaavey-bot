import type { MessageMiddleware } from "@/handlers/message-context";
import { afkMiddleware } from "./afk";
import { antiLink } from "./anti-link";
import { antiSpam } from "./anti-spam";
import { antiToxic } from "./anti-toxic";
import { antiViewOnce } from "./anti-viewonce";
import { autoReplyMiddleware } from "./auto-reply";
import { gameAnswerMiddleware } from "./game-answer";

export const middlewares: MessageMiddleware[] = [
  antiViewOnce,
  antiLink,
  antiSpam,
  antiToxic,
  afkMiddleware,
  gameAnswerMiddleware,
  autoReplyMiddleware,
];

export async function runMiddlewares(
  ctx: Parameters<MessageMiddleware>[0],
): Promise<"next" | "stop"> {
  for (const mw of middlewares) {
    const result = await mw(ctx);
    if (result === "stop") return "stop";
  }
  return "next";
}
