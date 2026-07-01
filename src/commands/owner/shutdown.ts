import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Shutdown",
  alias: ["off", "shutdown"],
  description: "Shutdown bot (owner only)",
  ownerOnly: true,
  handler: async (_sock, msg) => {
    await msg.reply("👋 Bot mati...");
    process.exit(0);
  },
});
