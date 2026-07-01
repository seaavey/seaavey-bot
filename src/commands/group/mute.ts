import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Mute",
  alias: ["mute"],
  description: "Close group (only admins can chat)",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    await sock.groupSettingUpdate(msg.jid, "announcement");
    await msg.reply("Group has been closed, only admins can chat.");
  },
});
