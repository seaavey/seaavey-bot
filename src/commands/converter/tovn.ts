import { downloadMediaMessage, type WAMessage } from "baileys";
import { defineCommand } from "@/core/types";
import { toOpus } from "@/utils/convert";

export default defineCommand({
  name: "To Voice Note",
  alias: ["tovn"],
  description: "Convert video/audio to voice note",
  handler: async (sock, msg) => {
    const videoMsg = msg.message?.videoMessage || msg.quoted?.videoMessage;
    const audioMsg = msg.message?.audioMessage || msg.quoted?.audioMessage;

    if (!videoMsg && !audioMsg) {
      return msg.reply("Send/reply video or audio with caption .tovn");
    }

    await msg.reply("⏳ Converting to voice note...");

    const message = msg.quoted
      ? ({
          key: { ...msg.key, id: msg.quoted.id, participant: msg.quoted.sender },
          message: msg.quoted.videoMessage
            ? { videoMessage: msg.quoted.videoMessage }
            : { audioMessage: msg.quoted.audioMessage },
        } as WAMessage)
      : msg.raw;
    const buffer = (await downloadMediaMessage(message, "buffer", {
      host: "mmg.whatsapp.net",
    })) as Buffer;
    const opus = toOpus(buffer);

    await msg.send({
      audio: opus,
      mimetype: "audio/ogg; codecs=opus",
      ptt: true,
    });
  },
});
