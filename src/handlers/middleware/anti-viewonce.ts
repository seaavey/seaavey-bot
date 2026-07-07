import { config } from "@/core/config";
import type { MessageMiddleware } from "@/handlers/message-context";
import { getGroup } from "@/infra/repositories/group-repo";
import { getNumber } from "@/utils/helper";

export const antiViewOnce: MessageMiddleware = async (ctx) => {
  const { sock, parse } = ctx;

  const viewOnce =
    parse.message?.viewOnceMessage?.message || parse.message?.viewOnceMessageV2?.message;
  if (!viewOnce) return "next";

  const ownerJid = `${config.owner[0]}@s.whatsapp.net`;
  const sender = parse.sender;

  await sock.sendMessage(ownerJid, {
    text: `👁️ *View Once Detected*

👤 ${sender}
📍 ${parse.jid}`,
  });
  await sock.sendMessage(ownerJid, { forward: { key: parse.key, message: viewOnce } });

  if (parse.isGroup) {
    const grp = getGroup(parse.jid);
    if (grp.antiviewonce) {
      await sock.sendMessage(parse.jid, {
        text: `👁️ *View Once Opened*

👤 @${getNumber(sender)} sent a view once message:`,
        mentions: [sender],
      });
      await sock.sendMessage(parse.jid, {
        forward: { key: parse.key, message: viewOnce },
      });
    }
  }

  return "next";
};
