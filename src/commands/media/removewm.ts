import { downloadMediaMessage, type WAMessage } from "baileys";
import { defineCommand } from "@/core/types";
import { removeWatermark } from "@/infra/scrapers";

export default defineCommand({
  name: "Remove Watermark",
  alias: ["removewm", "removewatermark", "unwm"],
  description: "Remove watermark from an image using EzRemove",
  tags: ["media"],
  handler: async (sock, msg) => {
    const imageMsg = msg.message?.imageMessage || msg.quoted?.imageMessage;

    if (!imageMsg) {
      return msg.reply("🚩 Reply or send an image with caption .removewm");
    }

    await msg.reply("⏳ Removing watermark...");

    try {
      const message = msg.quoted
        ? ({
            key: { ...msg.key, id: msg.quoted.id, participant: msg.quoted.sender },
            message: { imageMessage: msg.quoted.imageMessage },
          } as WAMessage)
        : msg.raw;
      const buffer = (await downloadMediaMessage(message, "buffer", {
        host: "mmg.whatsapp.net",
      })) as Buffer;

      const result = await removeWatermark(buffer);

      if (!result.status) {
        return msg.reply(`🚩 Failed: ${result.error || "Unknown error"}`);
      }

      await sock.sendMessage(
        msg.jid,
        {
          image: result.data.buffer,
        },
        { quoted: msg.raw },
      );
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      await msg.reply(`🚩 Failed: ${errMsg}`);
    }
  },
});
