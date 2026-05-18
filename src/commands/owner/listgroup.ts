import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "listgroup",
  description: "List all groups bot joined (owner only)",
  handler: async (sock, msg) => {
    if (!msg.isOwner) return;

    const groups = await sock.groupFetchAllParticipating();
    const list = Object.values(groups)
      .map((g, i) => `${i + 1}. ${g.subject} (${g.participants.length} members)`)
      .join("\n");

    await msg.reply(`📋 *Daftar Group (${Object.keys(groups).length})*\n\n${list}`);
  },
});
