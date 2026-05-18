import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "meme",
  description: "Generate meme. Contoh: .meme text atas | text bawah",
  handler: async (_sock, msg) => {
    const text = msg.args.join(" ");
    if (!text)
      return msg.reply(
        "Format: .meme <text atas> | <text bawah>\nContoh: .meme Ketika kode error | Tapi deadline besok",
      );
    const [top, bottom] = text.split("|").map((s) => s.trim());
    const url = `https://api.memegen.link/images/buzz/${encodeURIComponent(top || "_")}/${encodeURIComponent(bottom || "_")}.png`;
    await msg.send({ image: { url }, caption: "😂" });
  },
});
