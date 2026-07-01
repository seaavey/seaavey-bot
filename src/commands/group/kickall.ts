import { defineCommand } from "@/core/types";

const pending = new Set<string>();

export default defineCommand({
  name: "Kick All",
  alias: ["ka", "kickall"],
  description: "Kick all members except admins (with confirmation)",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    const key = `${msg.jid}:${msg.sender}`;

    if (!pending.has(key)) {
      pending.add(key);
      setTimeout(() => pending.delete(key), 30000);
      return msg.reply(
        "⚠️ *WARNING*\nThis will remove ALL members except admins.\n\nType *.kickall* again within 30 seconds to confirm.",
      );
    }

    pending.delete(key);

    const metadata = await sock.groupMetadata(msg.jid);
    const members = metadata.participants.filter((p) => !p.admin).map((p) => p.id);

    if (!members.length) return msg.reply("No members to kick!");

    await msg.reply(`Kicking all members (Total: ${members.length} regular members)...`);

    for (const member of members) {
      await sock.groupParticipantsUpdate(msg.jid, [member], "remove");
    }

    await msg.reply(`Done! ${members.length} members have been kicked.`);
  },
});
