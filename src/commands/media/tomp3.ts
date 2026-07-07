import { defineCommand } from "@/core/types";
import { toMp3 } from "@/utils/convert";

export default defineCommand({
  name: "To MP3",
  alias: ["mp3", "toaudio"],
  description: "Convert video/audio to MP3",
  handler: async (sock, msg) => {
    const media = msg.findMedia("videoMessage", "audioMessage");

    if (!media) {
      return msg.reply("Send/reply video or audio with caption .tomp3");
    }

    await msg.reply("⏳ Converting to MP3...");

    const buffer = await media.download();
    const mp3 = toMp3(buffer);

    await msg.send({
      audio: mp3,
      mimetype: "audio/mpeg",
      ptt: false,
    });
  },
});
