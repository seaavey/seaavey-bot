import { commands } from "@/infra/loader";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "totalfitur",
  description: "Hitung total command yang tersedia",
  handler: async (_sock, msg) => {
    await msg.reply(`📊 Total fitur: *${commands.size}* command`);
  },
});
