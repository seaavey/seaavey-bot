import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";

const InviteUrlRe = /chat\.whatsapp\.com\/([A-Za-z0-9]+)/;

export default defineCommand({
  name: "Join",
  alias: ["join"],
  description: t("owner.join.desc"),
  ownerOnly: true,
  handler: async (sock, msg) => {
    const input = msg.args[0];
    if (!input) return msg.reply(t("owner.join.format"));

    const match = input.match(InviteUrlRe);
    const code = match ? (match[1] ?? input) : input;

    try {
      const groupId: string = (await sock.groupAcceptInvite(code)) ?? "";
      if (!groupId) throw new Error("No group ID returned");
      const metadata = await sock.groupMetadata(groupId);
      await msg.reply(
        t("owner.join.success", {
          subject: metadata.subject,
          count: String(metadata.participants.length),
        }),
      );
    } catch {
      await msg.reply(t("owner.join.failed"));
    }
  },
});
