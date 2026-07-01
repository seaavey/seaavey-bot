import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Meme",
  alias: ["meme"],
  description: "Buat meme kustom",
  handler: async (_sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply("Format: .meme <text atas> | <text bawah>");
    const [top, bottom] = text.split("|").map((s: string) => s.trim());
    const url = `https://api.memegen.link/images/buzz/${encodeURIComponent(top || "_")}/${encodeURIComponent(bottom || "_")}.png`;
    await msg.send({ image: { url }, caption: "😂" });
  },
});
