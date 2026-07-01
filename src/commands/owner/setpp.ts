import { downloadMediaMessage, type WAMessage } from "baileys";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Set PP",
  alias: ["setpp"],
  description: "Set bot profile picture (owner only)",
  ownerOnly: true,
  handler: async (sock, msg) => {
    if (!sock.user?.id) return;

    const imageMsg = msg.message?.imageMessage || msg.quoted?.imageMessage;

    if (!imageMsg) return msg.reply("Format: .setpp (reply/send image)");

    const message = msg.quoted
      ? ({
          key: { ...msg.key, id: msg.quoted.id, participant: msg.quoted.sender },
          message: { imageMessage: msg.quoted.imageMessage },
        } as WAMessage)
      : msg.raw;
    const buffer = (await downloadMediaMessage(message, "buffer", {
      host: "mmg.whatsapp.net",
    })) as Buffer;

    await sock.updateProfilePicture(sock.user.id, buffer);
    await msg.reply("✅ Bot profile picture successfully changed!");
  },
});
