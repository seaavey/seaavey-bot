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
      text: `👋 @${getNumber(parse.sender)} sudah kembali! (AFK ${formatTime(Date.now() - senderAfk.timestamp)})`,
      mentions: [parse.sender],
    });
  }

  if (parse.body && !parse.body.startsWith(config.prefix)) {
    for (const m of parse.mentioned) {
      const afk = getAfk(m);
      if (afk) {
        await sock.sendMessage(parse.jid, {
          text: `💤 @${getNumber(m)} sedang AFK\nAlasan: ${afk.reason}\nSejak: ${formatTime(Date.now() - afk.timestamp)} lalu`,
          mentions: [m],
        });
      }
    }
  }

  return "next";
};
