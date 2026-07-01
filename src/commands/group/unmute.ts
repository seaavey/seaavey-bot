import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Unmute",
  alias: ["um", "unmute"],
  description: "Open group (all members can chat)",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    await sock.groupSettingUpdate(msg.jid, "not_announcement");
    await msg.reply("Group has been opened, all members can chat.");
  },
});
