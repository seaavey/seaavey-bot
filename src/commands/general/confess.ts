import { config } from "@/core/config";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Confess",
  alias: ["confess"],
  description: "Send an anonymous message to someone. Use in private chat.",
  privateOnly: true,
  handler: async (sock, msg) => {
    const target = msg.args[0];
    const message = msg.args.slice(1).join(" ");
    if (!target || !message)
      return msg.reply(
        "Format: .confess <number> <message>\nExample: .confess 6281234567890 Hey, I like you",
      );
    const targetJid = `${target.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
    await sock.sendMessage(targetJid, {
      text: `💌 *Anonymous Message*\n\n${message}\n\n_Reply with: ${config.prefix[0]}confessreply <message>_`,
    });
    await msg.reply("✅ Anonymous message sent!");
  },
});
