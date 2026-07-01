import { config } from "@/core/config";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Menfess",
  alias: ["menfess"],
  description: "Send an anonymous message to a WhatsApp number via the bot. Use in private chat.",
  privateOnly: true,
  handler: async (sock, msg) => {
    const target = msg.args[0];
    const message = msg.args.slice(1).join(" ");

    if (!target || !message) return msg.reply("Format: .menfess <number> <message>");

    const targetJid = `${target.replace(/[^0-9]/g, "")}@s.whatsapp.net`;

    const result = await sock.onWhatsApp(target.replace(/[^0-9]/g, ""));
    if (!result?.[0]?.exists) return msg.reply("🚩 Number not registered on WhatsApp.");

    await sock.sendMessage(targetJid, {
      text: `💌 *Menfess*

"${message}"

_Someone sent a secret message for you via ${config.name}._`,
    });

    await msg.reply("✅ Menfess sent! Your identity remains secret.");
  },
});
