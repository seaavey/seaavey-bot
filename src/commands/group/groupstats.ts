import db from "@/infra/database";
import { getNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";
export default defineCommand({
  name: "groupstats",
  description: "Statistik aktivitas group",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya untuk group.");

    const totalMembers = db
      .query("SELECT COUNT(*) as c FROM group_members WHERE groupJid = ?")
      .get(msg.jid) as { c: number };
    const totalChats = db
      .query("SELECT SUM(chatCount) as c FROM group_members WHERE groupJid = ?")
      .get(msg.jid) as { c: number | null };
    const today = Date.now() - 86400000;
    const activeToday = db
      .query("SELECT COUNT(*) as c FROM group_members WHERE groupJid = ? AND lastChat > ?")
      .get(msg.jid, today) as { c: number };
    const weekAgo = Date.now() - 7 * 86400000;
    const activeWeek = db
      .query("SELECT COUNT(*) as c FROM group_members WHERE groupJid = ? AND lastChat > ?")
      .get(msg.jid, weekAgo) as { c: number };
    const inactive = db
      .query("SELECT COUNT(*) as c FROM group_members WHERE groupJid = ? AND lastChat < ?")
      .get(msg.jid, weekAgo) as { c: number };

    const top3 = db
      .query(
        "SELECT memberJid, chatCount FROM group_members WHERE groupJid = ? ORDER BY chatCount DESC LIMIT 3",
      )
      .all(msg.jid) as { memberJid: string; chatCount: number }[];
    const medals = ["🥇", "🥈", "🥉"];
    const topList = top3
      .map((m, i) => `${medals[i]} @${getNumber(m.memberJid)} (${m.chatCount})`)
      .join("\n");

    await msg.send({
      text: `📊 *Group Analytics*\n\n👥 Total member: ${totalMembers.c}\n💬 Total pesan: ${(totalChats.c || 0).toLocaleString()}\n\n📈 *Aktivitas*\n• Aktif hari ini: ${activeToday.c}\n• Aktif minggu ini: ${activeWeek.c}\n• Tidak aktif (>7 hari): ${inactive.c}\n\n🏆 *Top 3 Aktif*\n${topList}`,
      mentions: top3.map((m) => m.memberJid),
    });
  },
});
