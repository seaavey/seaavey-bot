import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "tts",
  description: "Text to Speech. Contoh: .tts halo dunia",
  handler: async (_sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply("Format: .tts <teks>");
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=id&client=tw-ob`;
    await msg.send({ audio: { url }, mimetype: "audio/mpeg", ptt: true });
  },
});
