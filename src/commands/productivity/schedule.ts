import { addSchedule, deleteSchedule, getSchedules } from "@/infra/database";
import { defineCommand } from "@/core/types";

function parseTime(input: string): number | null {
  const match = input.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;
  const val = Number.parseInt(match[1] ?? "0", 10);
  const unit = match[2] ?? "m";
  const ms = unit === "m" ? val * 60000 : unit === "h" ? val * 3600000 : val * 86400000;
  return Date.now() + ms;
}

export default defineCommand({
  name: "schedule",
  description: "Jadwal pesan otomatis. Sub: add, list, del",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya bisa digunakan di group.");
    if (!msg.isAdmin) return msg.reply("❌ Hanya admin yang bisa menggunakan command ini.");

    const sub = msg.args[0]?.toLowerCase();

    if (sub === "add") {
      // .schedule add 30m|daily Pesan yang akan dikirim
      const parts = msg.args.slice(1).join(" ").split("|");
      if (parts.length < 2)
        return msg.reply(
          "Format: .schedule add <waktu> | <pesan>\n" +
            "Waktu: 30m, 2h, 1d\n" +
            "Contoh: .schedule add 1h | Jangan lupa sholat! 🕌",
        );

      const timeStr = parts[0]?.trim() ?? "";
      const message = parts.slice(1).join("|").trim();
      if (!message) return msg.reply("❌ Pesan tidak boleh kosong.");

      const triggerAt = parseTime(timeStr);
      if (!triggerAt) return msg.reply("❌ Format waktu salah. Gunakan: 30m, 2h, 1d");

      addSchedule(msg.jid, msg.sender, message, triggerAt);
      const date = new Date(triggerAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      await msg.reply(`✅ Pesan dijadwalkan!\n⏰ Akan dikirim: ${date}\n💬 "${message}"`);
    } else if (sub === "list") {
      const schedules = getSchedules(msg.jid);
      if (!schedules.length) return msg.reply("📭 Tidak ada jadwal aktif.");
      const list = schedules
        .map((s, i) => {
          const date = new Date(s.triggerAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
          return `${i + 1}. [ID:${s.id}] ⏰ ${date}\n   💬 "${s.message}"`;
        })
        .join("\n\n");
      await msg.reply(`📋 *Jadwal Aktif*\n\n${list}`);
    } else if (sub === "del") {
      const id = Number.parseInt(msg.args[1] ?? "", 10);
      if (!id) return msg.reply("Format: .schedule del <id>\nLihat ID dengan .schedule list");
      deleteSchedule(id);
      await msg.reply(`✅ Jadwal #${id} dihapus.`);
    } else {
      await msg.reply(
        "📖 *Schedule Commands*\n\n" +
          ".schedule add <waktu> | <pesan>\n" +
          ".schedule list\n" +
          ".schedule del <id>\n\n" +
          "Waktu: 30m (menit), 2h (jam), 1d (hari)",
      );
    }
  },
});
