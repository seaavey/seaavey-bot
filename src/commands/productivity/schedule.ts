import { defineCommand } from "@/core/types";
import { addSchedule, deleteSchedule, getSchedules } from "@/infra/database";

function parseTime(input: string): number | null {
  const match = input.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;
  const val = Number.parseInt(match[1] ?? "0", 10);
  const unit = match[2] ?? "m";
  const ms = unit === "m" ? val * 60000 : unit === "h" ? val * 3600000 : val * 86400000;
  return Date.now() + ms;
}

export default defineCommand({
  name: "Schedule",
  alias: ["sched", "schedule"],
  description: "Schedule automatic messages. Sub: add, list, del",
  groupOnly: true,
  adminOnly: true,
  handler: async (_sock, msg) => {
    const sub = msg.args[0]?.toLowerCase();

    if (sub === "add") {
      // .schedule add 30m|daily Pesan yang akan dikirim
      const parts = msg.args.slice(1).join(" ").split("|");
      if (parts.length < 2) return msg.reply("Format: .schedule add <waktu> | <pesan>");

      const timeStr = parts[0]?.trim() ?? "";
      const message = parts.slice(1).join("|").trim();
      if (!message) return msg.reply("🚩 Message cannot be empty.");

      const triggerAt = parseTime(timeStr);
      if (!triggerAt) return msg.reply("🚩 Invalid time format. Use: 30m, 2h, 1d");

      addSchedule(msg.jid, msg.sender, message, triggerAt);
      const date = new Date(triggerAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      await msg.reply(`✅ Message scheduled!
⏰ Will be sent: ${date}
💬 "${message}"`);
    } else if (sub === "list") {
      const schedules = getSchedules(msg.jid);
      if (!schedules.length) return msg.reply("📭 No active schedules.");
      const list = schedules
        .map((s, i) => {
          const date = new Date(s.triggerAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
          return `${i + 1}. [ID:${s.id}] ⏰ ${date}\n   💬 "${s.message}"`;
        })
        .join("\n\n");
      await msg.reply(`📋 *Active Schedules*

${list}`);
    } else if (sub === "del") {
      const id = Number.parseInt(msg.args[1] ?? "", 10);
      if (!id) return msg.reply("Format: .schedule del <id>");
      deleteSchedule(id);
      await msg.reply(`✅ Schedule #${String(id)} deleted.`);
    } else {
      await msg.reply("Format: .schedule add <waktu> | <pesan>");
    }
  },
});
