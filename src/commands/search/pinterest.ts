import { defineCommand } from "@/core/types";
import { pinterestSearch } from "@/infra/scrapers";

export default defineCommand({
  name: "Pinterest",
  alias: ["pin", "pinterest"],
  description: "Search images on Pinterest. Example: .pinterest anime wallpaper",
  handler: async (_sock, msg) => {
    const query = msg.args.join(" ");
    if (!query) return msg.reply("Format: .pinterest <kata kunci>");
    await msg.reply("⏳ Mencari di Pinterest...");
    const res = await pinterestSearch(query, 5);
    if (!res.status) return msg.reply(`🚩 ${res.error}`);
    if (!res.data.length) return msg.reply("🚩 Not found.");
    for (const pin of res.data) {
      await msg.send({ image: { url: pin.image }, caption: pin.title || "" });
    }
  },
});
