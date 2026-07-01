import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Set Desc",
  alias: ["sd", "setdesc"],
  description: "Change group description",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    const desc = msg.args.join(" ");
    if (!desc) return msg.reply("Enter a new description!");
    await sock.groupUpdateDescription(msg.jid, desc);
    await msg.reply("Group description has been changed!");
  },
});
