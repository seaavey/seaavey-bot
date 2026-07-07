import { defineCommand } from "@/core/types";
import { toOpus } from "@/utils/convert";

export default defineCommand({
  name: "To Voice Note",
  alias: ["tovn"],
  description: "Convert video/audio to voice note",
  handler: async (sock, msg) => {
    const media = msg.findMedia("videoMessage", "audioMessage");

    if (!media) {
      return msg.reply("Send/reply video or audio with caption .tovn");
    }

    await msg.reply("⏳ Converting to voice note...");

    const buffer = await media.download();
    const opus = toOpus(buffer);

    await msg.send({
      audio: opus,
      mimetype: "audio/ogg; codecs=opus",
      ptt: true,
    });
  },
});
