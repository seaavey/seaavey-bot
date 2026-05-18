import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "leave",
  description: "Bot leave from current group (owner only)",
  handler: async (sock, msg) => {
    if (!msg.isOwner) return;
    if (!msg.isGroup) return msg.reply("❌ Hanya bisa digunakan di group.");

    await msg.reply("👋 Bye!");
    await sock.groupLeave(msg.jid);
  },
});
