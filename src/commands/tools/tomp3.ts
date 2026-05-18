import { downloadMediaMessage, type WAMessage } from "baileys";
import { toMp3 } from "@/utils/convert";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "tomp3",
  description: "Convert video/audio to MP3",
  handler: async (_sock, msg) => {
    const raw = msg.msg;
    const quotedMsg = raw.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const videoMsg = raw.message?.videoMessage || quotedMsg?.videoMessage;
    const audioMsg = raw.message?.audioMessage || quotedMsg?.audioMessage;

    if (!videoMsg && !audioMsg) {
      return msg.reply("Kirim/reply video atau audio dengan caption .tomp3");
    }

    const message = quotedMsg ? ({ key: raw.key, message: quotedMsg } as WAMessage) : raw;
    const buffer = (await downloadMediaMessage(message, "buffer", {})) as Buffer;
    const mp3 = toMp3(buffer);

    await msg.send({
      audio: mp3,
      mimetype: "audio/mpeg",
      ptt: false,
    });
  },
});
