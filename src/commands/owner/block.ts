import { getNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";
export default defineCommand({
  name: "block",
  description: "Block a user (owner only)",
  handler: async (sock, msg) => {
    if (!msg.isOwner) return;

    const target = msg.mentioned[0] || msg.quoted;
    if (!target) return msg.reply("Tag atau reply user yang mau di-block.");

    await sock.updateBlockStatus(target, "block");
    await msg.reply(`✅ @${getNumber(target)} berhasil di-block.`);
  },
});
