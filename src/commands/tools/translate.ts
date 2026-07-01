import { defineCommand } from "@/core/types";
import { safeFetchJSON } from "@/utils/helper";

export default defineCommand({
  name: "Translate",
  alias: ["tr", "translate"],
  description: "Translate text. Example: .translate en Hello world",
  handler: async (_sock, msg) => {
    const lang = msg.args[0];
    const text = msg.args.slice(1).join(" ");
    if (!lang || !text) return msg.reply("Format: .translate <kode> <teks>");
    const data = await safeFetchJSON<{ responseData?: { translatedText?: string } }>(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`,
    );
    const translated = data?.responseData?.translatedText;
    if (!translated) return msg.reply("🚩 Translation failed.");
    await msg.reply(`🌍 *Translation (→ ${lang.toUpperCase()})*

${translated}`);
  },
});
