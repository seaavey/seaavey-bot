import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "TTS",
  alias: ["tts"],
  description: "Text to Speech. Example: .tts hello world",
  handler: async (_sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply("Format: .tts <text>");
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
    await msg.send({ audio: { url }, mimetype: "audio/mpeg", ptt: true });
  },
});
