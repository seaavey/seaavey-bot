import { defineCommand } from "@/core/types";
import { commands } from "@/core/loader";

export default defineCommand({
  name: "Total Fitur",
  alias: ["features", "totalfitur"],
  description: "Count total available commands",
  handler: async (_sock, msg) => {
    await msg.reply(`SeaaveyBot has *${String(commands.size)}* commands!`);
  },
});
