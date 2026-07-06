import { defineCommand } from "@/core/types";
import { ensureGroupMember, getSiders } from "@/infra/database";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "Sider",
  alias: ["sider"],
  description: "List members who haven't chatted for 3+ days",
  groupOnly: true,
  adminOnly: true,
  handler: async (sock, msg) => {
    const days = Number(msg.args[0]) || 3;
    const metadata = await sock.groupMetadata(msg.jid);

    for (const p of metadata.participants) {
      const memberJid = p.phoneNumber || p.id;
      ensureGroupMember(msg.jid, memberJid);
    }

    const allMembers = metadata.participants.map((p) => p.phoneNumber || p.id);

    const inactive = getSiders(msg.jid, days).map((s) => s.memberJid);
    const inactiveSet = new Set(inactive);

    const allSiders = allMembers.filter((m) => inactiveSet.has(m));

    if (!allSiders.length) {
      return msg.reply(`✅ No siders! All members active in the last ${days} days.`);
    }

    const list = allSiders.map((jid, i) => `${i + 1}. @${getNumber(jid)}`).join("\n");

    await msg.send({
      text: `🚶 *Sider List (${days} days)*
Total: ${allSiders.length}/${allMembers.length} members

${list}`,
      mentions: allSiders,
    });
  },
});
