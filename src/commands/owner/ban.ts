import { defineCommand } from "@/core/types";
import { isBanned, setBanned } from "@/infra/database";

export default defineCommand({
  name: "Ban",
  alias: ["ban"],
  description: "Ban/unban user (owner only)",
  ownerOnly: true,
  handler: async (_sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender;
    if (!target) return msg.reply("Format: .ban @user");

    if (isBanned(target)) {
      setBanned(target, false);
      await msg.reply(`✅ @${target.split("@")[0]} unbanned!`);
    } else {
      setBanned(target, true);
      await msg.reply(`✅ @${target.split("@")[0]} banned!`);
    }
  },
});
