import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";
import { setAfk } from "@/infra/database";
export default defineCommand({
  name: "afk",
  description: "Set status AFK",
  handler: async (_sock, msg) => {
    const reason = msg.args.join(" ") || "Tidak ada alasan";
    setAfk(msg.sender, reason);
    await msg.reply(`💤 @${getNumber(msg.sender)} sedang AFK\nAlasan: ${reason}`);
  },
});
