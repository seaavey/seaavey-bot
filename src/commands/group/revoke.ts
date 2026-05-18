import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "revoke",
  description: "Reset link invite grup",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    if (!msg.isAdmin) return msg.reply("Kamu bukan admin!");
    if (!msg.isBotAdmin) return msg.reply("Bot bukan admin!");
    await sock.groupRevokeInvite(msg.jid);
    await msg.reply("Link invite grup telah direset!");
  },
});
