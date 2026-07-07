import { defineCommand } from "@/core/types";

interface TikWMData {
  title: string;
  images: string[];
  play: string;
  music: string;
  author: { nickname: string } | string;
}

export default defineCommand({
  name: "TikTok DL",
  alias: ["tiktokdl"],
  description: "Download TikTok video/images via tikwm.com",
  handler: async (_sock, msg) => {
    const url = msg.text;
    if (!url) return msg.reply("Format: .ttdl <url>");

    await msg.reply("⏳ Downloading...");

    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const json = (await res.json()) as {
      code: number;
      msg: string;
      data: TikWMData;
    };

    if (json.code !== 0) {
      return msg.reply(`🚩 Failed: ${json.msg || "Unknown error"}`);
    }

    const { data } = json;
    const author =
      typeof data.author === "string" ? data.author : data.author?.nickname || "Unknown";

    if (data.play) {
      await msg.send({
        video: { url: data.play },
        caption: `${data.title}\n\n👤 ${author}`,
      });
    } else if (data.images?.length) {
      for (const image of data.images) {
        await msg.send({ image: { url: image } });
      }
      await msg.reply(`📸 ${data.images.length} images\n\n${data.title}\n👤 ${author}`);
    } else {
      await msg.reply("🚩 No media found.");
    }
  },
});
