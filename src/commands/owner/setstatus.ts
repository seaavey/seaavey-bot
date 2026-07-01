import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Set Status",
  alias: ["sst", "setstatus"],
  description: "Set bot bio/status (owner only)",
  ownerOnly: true,
  handler: async (sock, msg) => {
    if (!msg.args.length) return msg.reply("Format: .setstatus <status>");

    await sock.updateProfileStatus(msg.args.join(" "));
    await msg.reply("✅ Bot status successfully changed!");
  },
});
