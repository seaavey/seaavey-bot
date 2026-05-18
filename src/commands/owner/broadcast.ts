import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "broadcast",
  description: "Broadcast message to all groups (owner only)",
  handler: async (sock, msg) => {
    if (!msg.isOwner) return;
    if (!msg.args.length) return msg.reply("Contoh: .broadcast Halo semua!");

    const text = msg.args.join(" ");
    const groups = await sock.groupFetchAllParticipating();
    const jids = Object.keys(groups);

    for (const jid of jids) {
      await sock.sendMessage(jid, { text: `📢 *Broadcast*\n\n${text}` });
    }

    await msg.reply(`✅ Broadcast terkirim ke ${jids.length} group.`);
  },
});
