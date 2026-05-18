import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "delpp",
  description: "Remove bot profile picture (owner only)",
  handler: async (sock, msg) => {
    if (!msg.isOwner) return;
    if (!sock.user?.id) return;

    await sock.removeProfilePicture(sock.user.id);
    await msg.reply("✅ Profile picture bot berhasil dihapus!");
  },
});
