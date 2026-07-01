import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { soundcloudSearch } from "@/infra/scrapers";

export default defineCommand({
  name: "SoundCloud",
  alias: ["sc", "soundcloud"],
  description: t("search.soundcloud.desc"),
  handler: async (_sock, msg) => {
    const query = msg.args.join(" ");
    if (!query) return msg.reply(t("search.soundcloud.format"));

    await msg.reply(t("search.soundcloud.searching"));

    const result = await soundcloudSearch(query, 5);

    if (!result.status) {
      return msg.reply(
        t("search.soundcloud.failed", { error: result.error || t("search.soundcloud.notFound") }),
      );
    }

    if (result.data.tracks.length === 0) {
      return msg.reply(t("search.soundcloud.notFound"));
    }

    const list = result.data.tracks
      .map((s, i) => `${i + 1}. *${s.title}*\n   🎤 ${s.artist} • ⏱️ ${s.duration}\n   🔗 ${s.url}`)
      .join("\n\n");

    await msg.reply(t("search.soundcloud.result", { list }));
  },
});
