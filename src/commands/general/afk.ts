import { defineCommand } from "@/core/types";
import { setAfk } from "@/infra/database";

export default defineCommand({
  name: "AFK",
  alias: ["afk"],
  description: "Set AFK status",
  handler: async (_sock, msg) => {
    const reason = msg.args.join(" ") || "No reason";
    setAfk(msg.sender, reason);
    await msg.reply(`💤 AFK enabled! ${reason}`);
  },
});
