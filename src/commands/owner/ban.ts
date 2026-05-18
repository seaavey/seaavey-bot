import { isBanned, setBanned } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "ban",
  description: "Ban/unban user (owner only)",
  handler: async (_sock, msg) => {
    if (!msg.isOwner) return;

    const target = msg.mentioned[0] || msg.quoted;
    if (!target) return msg.reply("Tag atau reply user yang mau di-ban/unban.");

    if (isBanned(target)) {
      setBanned(target, false);
      await msg.reply(`✅ User ${target.split("@")[0]} telah di-unban.`);
    } else {
      setBanned(target, true);
      await msg.reply(`🚫 User ${target.split("@")[0]} telah di-ban.`);
    }
  },
});
