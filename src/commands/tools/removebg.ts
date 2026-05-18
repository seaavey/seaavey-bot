import { downloadMediaMessage } from "baileys";
import { config } from "@/core/config";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "removebg",
  description: "Hapus background gambar. Reply/kirim gambar.",
  handler: async (_sock, msg) => {
    const quotedMsg = msg.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = msg.msg.message?.imageMessage || quotedMsg?.imageMessage;
    if (!imgMsg) return msg.reply("❌ Reply atau kirim gambar yang ingin dihapus background-nya.");
    await msg.reply("⏳ Menghapus background...");
    const buffer = await downloadMediaMessage(
      { message: { imageMessage: imgMsg }, key: msg.msg.key } as Parameters<
        typeof downloadMediaMessage
      >[0],
      "buffer",
      {},
    );
    const form = new FormData();
    form.append("file", new Blob([buffer], { type: "image/png" }), "image.png");
    const res = await fetch("https://api.seaavey.com/tools/removebg", {
      method: "POST",
      headers: { "X-API-KEY": config.apiKey },
      body: form,
    });
    const data = (await res.json()) as { data?: { url: string } };
    if (!data.data?.url) return msg.reply("❌ Gagal menghapus background.");
    await msg.send({ image: { url: data.data.url }, caption: "✅ Background removed!" });
  },
});
