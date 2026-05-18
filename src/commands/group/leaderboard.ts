import db from "@/infra/database";
import { getNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";
export default defineCommand({
  name: "leaderboard",
  description: "Top 10 member paling aktif di group",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya bisa digunakan di group.");

    const top = db
      .query(
        "SELECT memberJid, chatCount FROM group_members WHERE groupJid = ? ORDER BY chatCount DESC LIMIT 10",
      )
      .all(msg.jid) as { memberJid: string; chatCount: number }[];

    if (!top.length) return msg.reply("❌ Belum ada data chat di group ini.");

    const medals = ["🥇", "🥈", "🥉"];
    const list = top
      .map(
        (m, i) => `${medals[i] || `${i + 1}.`} @${getNumber(m.memberJid)} — ${m.chatCount} pesan`,
      )
      .join("\n");

    await msg.send({
      text: `🏆 *Leaderboard Aktif*\n\n${list}`,
      mentions: top.map((m) => m.memberJid),
    });
  },
});
