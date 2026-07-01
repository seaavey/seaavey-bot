import { defineCommand } from "@/core/types";

const InviteUrlRe = /chat\.whatsapp\.com\/([A-Za-z0-9]+)/;

export default defineCommand({
  name: "Join",
  alias: ["join"],
  description: "Join group via invite link (owner only)",
  ownerOnly: true,
  handler: async (sock, msg) => {
    const input = msg.args[0];
    if (!input) return msg.reply("Format: .join <link>");

    const match = input.match(InviteUrlRe);
    const code = match ? (match[1] ?? input) : input;

    try {
      const groupId: string = (await sock.groupAcceptInvite(code)) ?? "";
      if (!groupId) throw new Error("No group ID returned");
      const metadata = await sock.groupMetadata(groupId);
      await msg.reply(
        `✅ Successfully joined *${metadata.subject}*.
👥 ${String(metadata.participants.length)} members`,
      );
    } catch {
      await msg.reply("🚩 Failed to join group. Link is invalid or expired.");
    }
  },
});
