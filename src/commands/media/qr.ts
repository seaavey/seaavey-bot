import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "QR",
  alias: ["qr"],
  description: "Create QR code from text/URL. Example: .qr https://google.com",
  handler: async (_sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply("Format: .qr <text/url>");
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    await msg.send({ image: { url }, caption: `📱 QR: ${text}` });
  },
});
