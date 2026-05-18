import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "qr",
  description: "Buat QR code dari teks/URL. Contoh: .qr https://google.com",
  handler: async (_sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply("Format: .qr <teks atau url>");
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    await msg.send({ image: { url }, caption: `📱 QR: ${text}` });
  },
});
