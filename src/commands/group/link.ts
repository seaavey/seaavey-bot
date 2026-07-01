import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Link",
  alias: ["link"],
  description: "Get group invite link",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    const code = await sock.groupInviteCode(msg.jid);
    await msg.reply(`https://chat.whatsapp.com/${code}`);
  },
});
