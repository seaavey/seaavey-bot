import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Meme",
  alias: ["meme"],
  description: "Create a custom meme. Use '|' to separate top and bottom text.",
  handler: async (_sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply("Format: .meme <top text> | <bottom text>");
    const [top, bottom] = text.split("|").map((s: string) => s.trim());
    const url = `https://api.memegen.link/images/buzz/${encodeURIComponent(top || "_")}/${encodeURIComponent(bottom || "_")}.png`;
    await msg.send({ image: { url }, caption: "😂" });
  },
});
