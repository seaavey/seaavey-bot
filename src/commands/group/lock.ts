import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Lock",
  alias: ["lock"],
  description: "Lock group settings (only admins can edit info)",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    await sock.groupSettingUpdate(msg.jid, "locked");
    await msg.reply("Group settings locked, only admins can edit info.");
  },
});
