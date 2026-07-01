import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Broadcast",
  alias: ["bc", "broadcast"],
  description: "Broadcast message to all groups (owner only)",
  ownerOnly: true,
  handler: async (sock, msg) => {
    if (!msg.args.length) return msg.reply("Format: .broadcast <pesan>");

    const text = msg.args.join(" ");
    const groups = await sock.groupFetchAllParticipating();
    const jids = Object.keys(groups);

    for (const jid of jids) {
      await sock.sendMessage(jid, { text: `📢 *Broadcast*\n\n${text}` });
    }

    await msg.reply(`✅ Broadcast sent to ${String(jids.length)} groups.`);
  },
});
