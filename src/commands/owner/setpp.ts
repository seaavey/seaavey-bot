import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Set PP",
  alias: ["setpp"],
  description: "Set bot profile picture (owner only)",
  ownerOnly: true,
  handler: async (sock, msg) => {
    if (!sock.user?.id) return;

    const media = msg.findMedia("imageMessage");

    if (!media) return msg.reply("Format: .setpp (reply/send image)");

    const buffer = await media.download();

    await sock.updateProfilePicture(sock.user.id, buffer);
    await msg.reply("✅ Bot profile picture successfully changed!");
  },
});
