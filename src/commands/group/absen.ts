import { getNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const sessions = new Map<string, { title: string; members: Set<string>; creator: string }>();

export default defineCommand({
  name: "absen",
  description: "Buat/tutup sesi absen. .absen buka <judul> / .absen hadir / .absen tutup",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya untuk group.");
    const sub = msg.args[0]?.toLowerCase();

    if (sub === "buka" || sub === "open") {
      if (!msg.isAdmin) return msg.reply("❌ Khusus admin.");
      const title = msg.args.slice(1).join(" ") || "Absensi";
      sessions.set(msg.jid, { title, members: new Set(), creator: msg.sender });
      return msg.reply(`📋 *Absensi Dibuka!*\n\n📝 ${title}\n\nKetik .absen hadir untuk absen.`);
    }

    if (sub === "hadir" || sub === "h") {
      const session = sessions.get(msg.jid);
      if (!session) return msg.reply("❌ Tidak ada sesi absen aktif.");
      session.members.add(msg.sender);
      return msg.reply(`✅ @${getNumber(msg.sender)} hadir! (${session.members.size} orang)`);
    }

    if (sub === "tutup" || sub === "close") {
      if (!msg.isAdmin) return msg.reply("❌ Khusus admin.");
      const session = sessions.get(msg.jid);
      if (!session) return msg.reply("❌ Tidak ada sesi absen aktif.");
      const list = [...session.members].map((m, i) => `${i + 1}. @${getNumber(m)}`).join("\n");
      sessions.delete(msg.jid);
      return msg.send({
        text: `📋 *Absensi Ditutup!*\n\n📝 ${session.title}\n👥 Total: ${session.members.size} orang\n\n${list}`,
        mentions: [...session.members],
      });
    }

    await msg.reply("Format:\n.absen buka <judul>\n.absen hadir\n.absen tutup");
  },
});
