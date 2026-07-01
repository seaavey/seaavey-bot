import { t } from "@/core/translations";
import { config } from "@/core/config";
import type { MessageMiddleware } from "@/handlers/message-context";
import { getAfk, removeAfk } from "@/infra/repositories/afk-repo";
import { formatTime, getNumber } from "@/utils/helper";

export const afkMiddleware: MessageMiddleware = async (ctx) => {
  const { sock, parse } = ctx;

  const senderAfk = getAfk(parse.sender);
  if (senderAfk) {
    removeAfk(parse.sender);
    await sock.sendMessage(parse.jid, {
      text: t("afk.back", {
        user: getNumber(parse.sender),
        duration: formatTime(Date.now() - senderAfk.timestamp),
      }),
      mentions: [parse.sender],
    });
  }

  const hasPrefix = config.prefix.some((p) => parse.body.startsWith(p));
  if (parse.body && !hasPrefix) {
    for (const m of parse.mentioned) {
      const afk = getAfk(m);
      if (afk) {
        await sock.sendMessage(parse.jid, {
          text: t("afk.away", {
            user: getNumber(m),
            reason: afk.reason,
            duration: formatTime(Date.now() - afk.timestamp),
          }),
          mentions: [m],
        });
      }
    }
  }

  return "next";
};
