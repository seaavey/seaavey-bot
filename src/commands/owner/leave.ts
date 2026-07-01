import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Leave",
  alias: ["leave"],
  description: "Bot leave from current group (owner only)",
  ownerOnly: true,
  groupOnly: true,
  handler: async (sock, msg) => {
    await msg.reply("👋 Bye!");
    await sock.groupLeave(msg.jid);
  },
});
