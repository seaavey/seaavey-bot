import { defineCommand } from "@/core/types";
import { instagramDl } from "@/infra/scrapers";
import { t } from "@/core/translations";

export default defineCommand({
  name: "Instagram DL",
  alias: ["instagramdl"],
  description: t("downloader.igdl.desc"),
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url)
      return msg.reply("Send an Instagram URL.\nExample: .igdl https://instagram.com/p/...");
    await msg.reply("⏳ Downloading...");
    const res = await instagramDl(url);
    if (!res.status) return msg.reply(`❌ Error: ${res.error}`);
    for (const media of res.data) {
      if (media.type === "video") {
        await msg.send({ video: { url: media.url } });
      } else {
        await msg.send({ image: { url: media.url } });
      }
    }
  },
});
