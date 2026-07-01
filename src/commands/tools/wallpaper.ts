import { defineCommand } from "@/core/types";
import { safeFetchJSON } from "@/utils/helper";

export default defineCommand({
  name: "Wallpaper",
  alias: ["wallpaper", "wp"],
  description: "Random mobile wallpaper dari Wallhaven",
  usage: "{prefix}wallpaper",
  tags: ["tools"],
  handler: async (_sock, msg) => {
    const data = await safeFetchJSON<{
      data?: Array<{ path: string; resolution: string }>;
    }>(
      "https://wallhaven.cc/api/v1/search?categories=111&purity=100&resolutions=1080x2340&sorting=random",
    );

    if (!data?.data?.[0]?.path) {
      return msg.reply("❌ Gagal mengambil wallpaper.");
    }

    const wallpaper = data.data[0];
    await msg.send({
      image: { url: wallpaper.path },
      caption: `🎨 Random Mobile Wallpaper\n\n📐 *Resolusi:* ${wallpaper.resolution}`,
    });
  },
});
