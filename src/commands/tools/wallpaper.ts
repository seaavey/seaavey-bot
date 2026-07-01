import { defineCommand } from "@/core/types";
import { safeFetchJSON } from "@/utils/helper";

interface IWallHavenThumbs {
  large: string;
  original: string;
  small: string;
}

interface IWallHavenData {
  id: string;
  url: string;
  short_url: string;
  views: number;
  favorites: number;
  source: string;
  purity: "sfw" | "sketchy" | "nsfw";
  category: "general" | "anime" | "people";
  dimension_x: number;
  dimension_y: number;
  resolution: string;
  ratio: string;
  file_size: number;
  file_type: string;
  created_at: string;
  colors: string[];
  path: string;
  thumbs: IWallHavenThumbs;
}

interface IWallHavenMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  query: string | null;
  seed: string | null;
}

interface IWallHaven {
  data: IWallHavenData[];
  meta: IWallHavenMeta;
}
export default defineCommand({
  name: "Wallpaper",
  alias: ["wallpaper", "wp"],
  description: "Random mobile wallpaper dari Wallhaven",
  usage: "{prefix}wallpaper",
  tags: ["tools"],
  handler: async (_sock, msg) => {
    const data = await safeFetchJSON<IWallHaven>(
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
