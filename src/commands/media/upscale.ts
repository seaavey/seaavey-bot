import { downloadMediaMessage, type WAMessage } from "baileys";
import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { upscaleImage } from "@/infra/scrapers";

export default defineCommand({
  name: "Upscale",
  alias: ["upscale", "hd"],
  description: t("media.upscale.desc"),
  usage: "{prefix}upscale [2|4]",
  tags: ["media"],
  handler: async (sock, msg) => {
    const isImage = msg.message?.imageMessage || msg.quoted?.imageMessage;

    if (!isImage) return msg.reply(t("media.upscale.noImage"));

    const scale = parseInt(msg.args[0] || "4") as 2 | 4;
    if (![2, 4].includes(scale)) return msg.reply(t("media.upscale.invalidScale"));

    await msg.reply(t("media.upscale.processing", { scale: String(scale) }));

    try {
      const mediaMsg = msg.quoted
        ? {
            message: { imageMessage: msg.quoted.imageMessage },
            key: { ...msg.key, id: msg.quoted.id, participant: msg.quoted.sender },
          }
        : msg.raw;
      const buffer = await downloadMediaMessage(mediaMsg as WAMessage, "buffer", {
        host: "mmg.whatsapp.net",
      });

      const result = await upscaleImage(Buffer.from(buffer), scale);
      if (!result.status) return msg.reply(`❌ ${result.error}`);

      await sock.sendMessage(
        msg.jid,
        {
          image: result.data.buffer,
          caption: t("media.upscale.success", {
            scale: String(result.data.scale),
            server: result.data.server,
          }),
        },
        { quoted: msg.raw },
      );
    } catch (e: unknown) {
      const error = e as Error;
      await msg.reply(t("media.upscale.failed", { error: error.message }));
    }
  },
});
