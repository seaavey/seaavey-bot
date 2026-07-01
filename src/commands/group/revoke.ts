import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Revoke",
  alias: ["rev", "revoke"],
  description: "Reset group invite link",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    await sock.groupRevokeInvite(msg.jid);
    await msg.reply("Group invite link has been reset!");
  },
});
