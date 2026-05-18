import { downloadMediaMessage, type WAMessage } from "baileys";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "setpp",
  description: "Set bot profile picture (owner only)",
  handler: async (sock, msg) => {
    if (!msg.isOwner) return;
    if (!sock.user?.id) return;

    const raw = msg.msg;
    const quotedMsg = raw.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = raw.message?.imageMessage || quotedMsg?.imageMessage;

    if (!imageMsg) return msg.reply("Kirim/reply gambar dengan caption .setpp");

    const message = quotedMsg ? ({ key: raw.key, message: quotedMsg } as WAMessage) : raw;
    const buffer = (await downloadMediaMessage(message, "buffer", {})) as Buffer;

    await sock.updateProfilePicture(sock.user.id, buffer);
    await msg.reply("✅ Profile picture bot berhasil diubah!");
  },
});
