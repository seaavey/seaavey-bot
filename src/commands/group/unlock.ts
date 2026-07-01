import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Unlock",
  alias: ["ul", "unlock"],
  description: "Unlock group settings (all members can edit info)",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    await sock.groupSettingUpdate(msg.jid, "unlocked");
    await msg.reply("Group settings unlocked, all members can edit info.");
  },
});
