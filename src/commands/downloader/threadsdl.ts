import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { threadsDl } from "@/infra/scrapers";

export default defineCommand({
  name: "Threads DL",
  alias: ["tdl", "threadsdl"],
  description: t("downloader.threadsdl.desc"),
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply(t("downloader.threadsdl.format"));

    await msg.reply("⏳ Downloading...");

    const result = await threadsDl(url);

    if (!result.status) {
      return msg.reply(
        t("downloader.threadsdl.failed", {
          error: result.error || t("downloader.threadsdl.noMedia"),
        }),
      );
    }

    for (const media of result.data) {
      const isVideo = media.type === "video";
      await msg.send(isVideo ? { video: { url: media.url } } : { image: { url: media.url } });
    }
  },
});
