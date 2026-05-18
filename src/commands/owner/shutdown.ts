import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "shutdown",
  description: "Shutdown bot (owner only)",
  handler: async (_sock, msg) => {
    if (!msg.isOwner) return;

    await msg.reply("👋 Bot mati...");
    process.exit(0);
  },
});
