import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Group Info",
  alias: ["ginfo", "groupinfo"],
  description: "View group info",
  groupOnly: true,
  handler: async (sock, msg) => {
    const metadata = await sock.groupMetadata(msg.jid);
    const admins = metadata.participants.filter((p) => p.admin);
    const creationDate = new Date((metadata.creation || 0) * 1000).toLocaleDateString("id-ID");
    const text = [
      `*${metadata.subject}*`,
      `ID: ${metadata.id}`,
      `Created: ${creationDate}`,
      `Members: ${metadata.participants.length}`,
      `Admins: ${admins.length}`,
      `Description: ${metadata.desc || "-"}`,
    ].join("\n");
    await msg.reply(text);
  },
});
