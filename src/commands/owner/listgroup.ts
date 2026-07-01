import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "List Group",
  alias: ["lg", "groups", "listgroup"],
  description: "List all groups bot joined (owner only)",
  ownerOnly: true,
  handler: async (sock, msg) => {
    const groups = await sock.groupFetchAllParticipating();
    const list = Object.values(groups)
      .map((g, i) => `${i + 1}. ${g.subject} (${g.participants.length} members)`)
      .join("\n");

    await msg.reply(`📋 *Group List (${Object.keys(groups).length})*

${list}`);
  },
});
