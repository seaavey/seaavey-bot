import { defineCommand } from "@/core/types";
import { safeFetchJSON } from "@/utils/helper";

export default defineCommand({
  name: "Waifu",
  alias: ["waifu"],
  description: "Get a random waifu image from waifu.pics API",
  handler: async (_sock, msg) => {
    const data = await safeFetchJSON<{ url?: string }>("https://api.waifu.pics/sfw/waifu");
    if (!data?.url) return msg.reply("🚩 Failed to fetch image.");
    await msg.send({ image: { url: data.url }, caption: "Here is your waifu! 🌸" });
  },
});
