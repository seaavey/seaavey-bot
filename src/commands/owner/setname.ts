import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "setname",
  description: "Set bot display name (owner only)",
  handler: async (sock, msg) => {
    if (!msg.isOwner) return;
    if (!msg.args.length) return msg.reply("Contoh: .setname SeaaveyBot");

    await sock.updateProfileName(msg.args.join(" "));
    await msg.reply("✅ Nama bot berhasil diubah!");
  },
});
