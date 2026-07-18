import { type WAMessage, proto, downloadMediaMessage } from "baileys";
import { config } from "@/core/config";
import type { MessageMiddleware } from "@/handlers/message-context";
import { ensureGroup } from "@/infra/repositories/group-repo";
import { getNumber } from "@/utils/helper";

async function forwardViewOnce(
  key: WAMessage["key"],
  viewOnce: proto.IMessage,
): Promise<Buffer | null> {
  // Reconstruct a minimal WAMessage so downloadMediaMessage can find the media
  const msg = { key, message: { viewOnceMessage: { message: viewOnce } } } as unknown as WAMessage;
  try {
    return (await downloadMediaMessage(msg, "buffer", {
      host: "mmg.whatsapp.net",
    })) as Buffer;
  } catch {
    return null;
  }
}

function isAudioMessage(m: proto.IMessage): boolean {
  return !!m.audioMessage;
}

export const antiViewOnce: MessageMiddleware = async (ctx) => {
  const { sock, parse } = ctx;

  const viewOnce =
    parse.message?.viewOnceMessage?.message || parse.message?.viewOnceMessageV2?.message;
  if (!viewOnce) return "next";

  const ownerJid = `${config.owner[0]}@s.whatsapp.net`;
  const sender = parse.sender;

  // Download the hidden media
  const buffer = await forwardViewOnce(parse.key, viewOnce);

  // Forward to owner
  await sock.sendMessage(ownerJid, {
    text: `👁️ *View Once Detected*

👤 ${sender}
📍 ${parse.jid}`,
  });
  if (buffer) {
    const isAudio = isAudioMessage(viewOnce);
    await sock.sendMessage(
      ownerJid,
      isAudio
        ? { audio: buffer, mimetype: "audio/mpeg" }
        : { image: buffer, caption: "📸 View once media" },
    );
  }

  if (parse.isGroup) {
    const grp = ensureGroup(parse.jid);
    if (grp.antiviewonce) {
      await sock.sendMessage(parse.jid, {
        text: `👁️ *View Once Opened*

👤 @${getNumber(sender)} sent a view once message:`,
        mentions: [sender],
      });
      if (buffer) {
        const isAudio = isAudioMessage(viewOnce);
        await sock.sendMessage(
          parse.jid,
          isAudio ? { audio: buffer, mimetype: "audio/mpeg" } : { image: buffer },
        );
      }
    }
  }

  return "next";
};
