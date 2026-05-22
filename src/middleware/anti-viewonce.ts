import { config } from "@/core/config";
import type { MessageMiddleware } from "@/handlers/message-context";
import { getGroup } from "@/infra/repositories/group-repo";
import { getNumber } from "@/utils/helper";

export const antiViewOnce: MessageMiddleware = async (ctx) => {
  const { sock, raw } = ctx;

  const viewOnce = raw.message?.viewOnceMessage?.message || raw.message?.viewOnceMessageV2?.message;
  if (!viewOnce) return "next";

  const ownerJid = `${config.owner[0]}@s.whatsapp.net`;
  const sender = raw.key.participant || raw.key.remoteJid || "";

  await sock.sendMessage(ownerJid, {
    text: `👁️ *View Once Detected*\n\n👤 ${sender}\n📍 ${raw.key.remoteJid}`,
  });
  await sock.sendMessage(ownerJid, { forward: { key: raw.key, message: viewOnce } });

  if (raw.key.remoteJid?.endsWith("@g.us")) {
    const grp = getGroup(raw.key.remoteJid);
    if (grp.antiviewonce) {
      await sock.sendMessage(raw.key.remoteJid, {
        text: `👁️ *View Once Opened*\n\n👤 @${getNumber(sender)} mengirim pesan view once:`,
        mentions: [sender],
      });
      await sock.sendMessage(raw.key.remoteJid, {
        forward: { key: raw.key, message: viewOnce },
      });
    }
  }

  return "next";
};
