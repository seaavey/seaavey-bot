import db, { getSiders, updateMemberChat } from "@/infra/database";
import { getNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";
export default defineCommand({
  name: "sider",
  description: "List member yang tidak chat selama 3+ hari",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya bisa digunakan di group.");
    if (!msg.isAdmin) return msg.reply("❌ Hanya admin yang bisa menggunakan command ini.");

    const days = Number(msg.args[0]) || 3;
    const metadata = await sock.groupMetadata(msg.jid);

    // Sync all members to DB (missing ones will be inserted with lastChat = now)
    for (const p of metadata.participants) {
      const memberJid = p.phoneNumber || p.id;
      const exists = db
        .query("SELECT 1 FROM group_members WHERE groupJid = ? AND memberJid = ?")
        .get(msg.jid, memberJid);
      if (!exists) updateMemberChat(msg.jid, memberJid);
    }

    // Get all members from participant list
    const allMembers = metadata.participants.map((p) => p.phoneNumber || p.id);

    // Recorded members who haven't chatted in a while
    const inactive = getSiders(msg.jid, days).map((s) => s.memberJid);
    const inactiveSet = new Set(inactive);

    // Filter only those in the participant list
    const allSiders = allMembers.filter((m) => inactiveSet.has(m));

    if (!allSiders.length) {
      return msg.reply(`✅ Tidak ada sider! Semua member aktif dalam ${days} hari terakhir.`);
    }

    const list = allSiders.map((jid, i) => `${i + 1}. @${getNumber(jid)}`).join("\n");

    await msg.send({
      text: `🚶 *Daftar Sider (${days} hari)*\nTotal: ${allSiders.length}/${allMembers.length} member\n\n${list}`,
      mentions: allSiders,
    });
  },
});
