import { defineCommand } from "@/core/types";
import { pinterestDl } from "@/infra/scrapers";

export default defineCommand({
  name: "Pinterest DL",
  alias: ["pindl", "pinterestdl"],
  description: "Download media from Pinterest",
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) {
      return msg.reply("Send a Pinterest URL.\nExample: .pindl https://pin.it/xxxxx");
    }

    await msg.reply("⏳ Downloading...");
    const res = await pinterestDl(url);
    if (!res.status) return msg.reply(`🚩 ${res.error}`);

    const pin = res.data;
    if (pin.video) {
      await msg.send({
        video: { url: pin.video },
        caption: pin.title || "",
      });
    } else {
      await msg.send({
        image: { url: pin.image },
        caption: pin.title || "",
      });
    }
  },
});
