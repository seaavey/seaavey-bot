import { defineCommand } from "@/core/types";
import { t } from "@/core/translations";
import db, { getSiders, updateMemberChat } from "@/infra/database";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "Sider",
  alias: ["sider"],
  description: t("group.sider.description"),
  groupOnly: true,
  adminOnly: true,
  handler: async (sock, msg) => {
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
      return msg.reply(t("group.sider.none", { days }));
    }

    const list = allSiders.map((jid, i) => `${i + 1}. @${getNumber(jid)}`).join("\n");

    await msg.send({
      text: t("group.sider.list", {
        days,
        count: allSiders.length,
        total: allMembers.length,
        list,
      }),
      mentions: allSiders,
    });
  },
});
