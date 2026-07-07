import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "OCR",
  alias: ["ocr"],
  description: "Extract text from image. Reply image with .ocr",
  handler: async (sock, msg) => {
    const media = msg.findMedia("imageMessage");
    if (!media) return msg.reply("🚩 Reply to an image with .ocr");
    await msg.reply("⏳ Reading text from image...");
    const buffer = await media.download();
    const form = new FormData();
    form.append("file", new Blob([buffer], { type: "image/png" }), "image.png");
    form.append("apikey", "K89642968388957");
    form.append("language", "ind");
    const res = await fetch("https://api.ocr.space/parse/image", { method: "POST", body: form });
    const data = (await res.json()) as { ParsedResults?: Array<{ ParsedText: string }> };
    const text = data.ParsedResults?.[0]?.ParsedText;
    if (!text) return msg.reply("🚩 No text detected.");
    await msg.reply(`📝 *OCR Result*

${text}`);
  },
});
