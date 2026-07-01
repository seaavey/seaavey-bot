import { downloadMediaMessage, type WAMessage } from "baileys";
import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { removeWatermark } from "@/infra/scrapers";

export default defineCommand({
  name: "Remove Watermark",
  alias: ["removewm", "removewatermark", "unwm"],
  description: t("media.removewm.desc"),
  tags: ["media"],
  handler: async (sock, msg) => {
    const imageMsg = msg.message?.imageMessage || msg.quoted?.imageMessage;

    if (!imageMsg) {
      return msg.reply(t("media.removewm.noImage"));
    }

    await msg.reply(t("media.removewm.processing"));

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
        return msg.reply(t("media.removewm.failed", { error: result.error || "Unknown error" }));
      }

      await sock.sendMessage(
        msg.jid,
        {
          image: result.data.buffer,
        },
        { quoted: msg.raw },
      );
    } catch (e: unknown) {
      const error = e as Error;
      await msg.reply(t("media.removewm.failed", { error: error.message }));
    }
  },
});
