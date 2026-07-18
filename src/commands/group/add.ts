import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";

export default defineCommand({
  name: "Add",
  alias: ["add"],
  description: "Add member to group",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    const number = msg.args.join(" ").replace(/[^0-9]/g, "");
    if (!number) return msg.reply("Enter the number! Example: !add 6281234567890");
    const target = `${number}@s.whatsapp.net`;

    const result = await sock.groupParticipantsUpdate(msg.jid, [target], "add");
    const status = result[0]?.status;

    if (status === "200") {
      await msg.send({
        text: `✅ @${getNumber(target)} added to group!`,
        mentions: [target],
      });
    } else {
      // 403 → send GroupInviteMessage card to target via DM
      const groupMeta = await sock.groupMetadata(msg.jid);
      const code = await sock.groupInviteCode(msg.jid);

      try {
        await sock.sendMessage(target, {
          groupInvite: {
            jid: msg.jid,
            inviteCode: code ?? "",
            inviteExpiration: Math.floor(Date.now() / 1000) + 7 * 86400, // 7 days
            subject: groupMeta.subject,
            text: `Undangan untuk bergabung ke grup WhatsApp saya`,
          },
        });
        await msg.reply(
          `❌ Can't add directly (privacy: 403).\n📩 Invite card sent to @${getNumber(target)} via DM.`,
        );
      } catch {
        await msg.reply(
          `❌ Can't add (privacy: 403). 📎 Invite link: https://chat.whatsapp.com/${code}\nSend this to @${getNumber(target)} manually.`,
        );
      }
    }
  },
});
