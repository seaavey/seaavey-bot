import { defineCommand } from "@/core/types";
import { twitterDl } from "@/infra/scrapers";

export default defineCommand({
  name: "X (Twitter) DL",
  alias: ["xdl", "x(twitter)dl"],
  description: "Download media from X/Twitter",
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply("Format: .xdl <url>");
    if (!url.includes("x.com") && !url.includes("twitter.com"))
      return msg.reply("🚩 URL must be from X/Twitter");
    await msg.reply("⏳ Downloading...");
    const res = await twitterDl(url);
    if (!res.status) return msg.reply(`🚩 ${res.error}`);
    const { video, photo, title, author } = res.data;
    if (video) {
      await msg.send({
        video: { url: video },
        caption: `🐦 ${author ? `@${author}` : ""}${title ? ` — ${title}` : ""}`,
      });
    } else if (photo) {
      await msg.send({
        image: { url: photo },
        caption: `🐦 ${author ? `@${author}` : ""}${title ? ` — ${title}` : ""}`,
      });
    } else {
      await msg.reply("🚩 No media found in this tweet");
    }
  },
});
