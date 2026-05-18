import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "unblock",
  description: "Unblock a user (owner only)",
  handler: async (sock, msg) => {
    if (!msg.isOwner) return;

    const target = msg.mentioned[0] || msg.quoted;
    if (!target) return msg.reply("Tag atau reply user yang mau di-unblock.");

    await sock.updateBlockStatus(target, "unblock");
    await msg.reply(`✅ @${getNumber(target)} berhasil di-unblock.`);
  },
});
