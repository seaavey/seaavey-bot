import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Meme",
  alias: ["meme"],
  description: t("fun.meme.description"),
  handler: async (_sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply(t("fun.meme.format"));
    const [top, bottom] = text.split("|").map((s: string) => s.trim());
    const url = `https://api.memegen.link/images/buzz/${encodeURIComponent(top || "_")}/${encodeURIComponent(bottom || "_")}.png`;
    await msg.send({ image: { url }, caption: "😂" });
  },
});
