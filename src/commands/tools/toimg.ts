import { downloadMediaMessage, type WAMessage } from "baileys";
import { stickerToImage } from "@/utils/convert";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "toimg",
  description: "Convert sticker to image",
  handler: async (_sock, msg) => {
    const raw = msg.msg;
    const contextInfo = raw.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = contextInfo?.quotedMessage;
    const sticker =
      quotedMsg?.stickerMessage ||
      quotedMsg?.viewOnceMessageV2?.message?.stickerMessage ||
      quotedMsg?.ephemeralMessage?.message?.stickerMessage;

    if (!sticker) {
      return msg.reply("Reply sticker dengan caption .toimg");
    }

    const message = {
      key: { ...raw.key, id: contextInfo?.stanzaId, participant: contextInfo?.participant },
      message: { stickerMessage: sticker },
    } as WAMessage;

    const buffer = (await downloadMediaMessage(message, "buffer", {})) as Buffer;
    const image = stickerToImage(buffer);

    await msg.send({ image });
  },
});
