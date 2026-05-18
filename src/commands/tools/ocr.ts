import { downloadMediaMessage } from "baileys";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "ocr",
  description: "Extract teks dari gambar. Reply gambar dengan .ocr",
  handler: async (_sock, msg) => {
    const quotedMsg = msg.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = msg.msg.message?.imageMessage || quotedMsg?.imageMessage;
    if (!imgMsg) return msg.reply("❌ Reply gambar dengan .ocr");
    await msg.reply("🔍 Membaca teks...");
    const buffer = await downloadMediaMessage(
      { message: { imageMessage: imgMsg }, key: msg.msg.key } as Parameters<
        typeof downloadMediaMessage
      >[0],
      "buffer",
      {},
    );
    const form = new FormData();
    form.append("file", new Blob([buffer], { type: "image/png" }), "image.png");
    form.append("apikey", "K89642968388957");
    form.append("language", "ind");
    const res = await fetch("https://api.ocr.space/parse/image", { method: "POST", body: form });
    const data = (await res.json()) as { ParsedResults?: Array<{ ParsedText: string }> };
    const text = data.ParsedResults?.[0]?.ParsedText;
    if (!text) return msg.reply("❌ Tidak ada teks yang terdeteksi.");
    await msg.reply(`📝 *OCR Result:*\n\n${text}`);
  },
});
