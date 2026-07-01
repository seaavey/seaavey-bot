import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { safeFetchJSON } from "@/utils/helper";

export default defineCommand({
  name: "Translate",
  alias: ["tr", "translate"],
  description: t("tools.translate.desc"),
  handler: async (_sock, msg) => {
    const lang = msg.args[0];
    const text = msg.args.slice(1).join(" ");
    if (!lang || !text) return msg.reply(t("tools.translate.format"));
    const data = await safeFetchJSON<{ responseData?: { translatedText?: string } }>(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`,
    );
    const translated = data?.responseData?.translatedText;
    if (!translated) return msg.reply(t("tools.translate.failed"));
    await msg.reply(t("tools.translate.result", { lang: lang.toUpperCase(), translated }));
  },
});
