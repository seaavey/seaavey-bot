import { downloadMediaMessage, type WAMessage } from "baileys";
import { defineCommand } from "@/core/types";
import { removeBackground } from "@/infra/scrapers";

export default defineCommand({
  name: "Remove Background",
  alias: ["removebg", "rbg"],
  description: "Remove image background",
  handler: async (sock, msg) => {
    const imageMsg = msg.message?.imageMessage || msg.quoted?.imageMessage;

    if (!imageMsg) {
      return msg.reply("Send or reply to an image with caption .removebg");
    }

    await msg.reply("⏳ Removing background...");

    const message = msg.quoted
      ? ({
          key: { ...msg.key, id: msg.quoted.id, participant: msg.quoted.sender },
          message: { imageMessage: msg.quoted.imageMessage },
        } as WAMessage)
      : msg.raw;
    const buffer = (await downloadMediaMessage(message, "buffer", {
      host: "mmg.whatsapp.net",
    })) as Buffer;

    const result = await removeBackground(buffer);

    if (!result.status) {
      return msg.reply(result.error || "Failed to remove background.");
    }

    await msg.send({ image: result.data.buffer });
  },
});
