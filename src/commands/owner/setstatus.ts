import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "setstatus",
  description: "Set bot bio/status (owner only)",
  handler: async (sock, msg) => {
    if (!msg.isOwner) return;
    if (!msg.args.length) return msg.reply("Contoh: .setstatus Bot aktif 24 jam");

    await sock.updateProfileStatus(msg.args.join(" "));
    await msg.reply("✅ Status bot berhasil diubah!");
  },
});
