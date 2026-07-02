import { readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { defineCommand } from "@/core/types";
import { ytmp3 } from "@/infra/scrapers";

export default defineCommand({
  name: "YT MP3",
  alias: ["ytmp3"],
  description: "Download audio from YouTube",
  cooldown: 30,
  handler: async (_sock, msg) => {
    const url = msg.args[0];
    if (!url) return msg.reply("Format: .ytmp3 <url>");

    await msg.reply("⏳ Downloading audio...");

    const result = await ytmp3(url);

    if (!result.status) {
      return msg.reply(`🚩 Failed: ${result.error || "Media not found"}`);
    }

    const { title, thumbnail, downloadUrl, format } = result.data;

    const caption = [`🎵 *${title}*`, format ? `📦 ${format}` : null].filter(Boolean).join("\n");

    if (thumbnail) {
      await msg.send({ image: { url: thumbnail }, caption });
    } else {
      await msg.reply(caption);
    }

    if (downloadUrl) {
      // Use local MP3 file if available, otherwise fallback to URL
      if (result.data.localFile) {
        const audioBuffer = readFileSync(result.data.localFile);
        await msg.send({
          audio: audioBuffer,
          mimetype: "audio/mpeg",
          ptt: false,
        });
        // Cleanup temp files
        try {
          rmSync(dirname(result.data.localFile), { recursive: true, force: true });
        } catch {}
      } else {
        await msg.send({ audio: { url: downloadUrl }, mimetype: "audio/mpeg" });
      }
    }
  },
});
