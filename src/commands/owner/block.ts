import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "Block",
  alias: ["block"],
  description: "Block a user (owner only)",
  ownerOnly: true,
  handler: async (sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender;
    if (!target) return msg.reply("Format: .block @user");

    await sock.updateBlockStatus(target, "block");
    await msg.reply(`✅ @${getNumber(target)} has been blocked.`);
  },
});
