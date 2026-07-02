import { downloadMediaMessage, type WAMessage } from "baileys";
import { defineCommand } from "@/core/types";
import { toMp3 } from "@/utils/convert";

export default defineCommand({
  name: "To MP3",
  alias: ["mp3", "toaudio"],
  description: "Convert video/audio to MP3",
  handler: async (sock, msg) => {
    const videoMsg = msg.message?.videoMessage || msg.quoted?.videoMessage;
    const audioMsg = msg.message?.audioMessage || msg.quoted?.audioMessage;

    if (!videoMsg && !audioMsg) {
      return msg.reply("Send/reply video or audio with caption .tomp3");
    }

    await msg.reply("⏳ Converting to MP3...");

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
    const mp3 = toMp3(buffer);

    await msg.send({
      audio: mp3,
      mimetype: "audio/mpeg",
      ptt: false,
    });
  },
});
