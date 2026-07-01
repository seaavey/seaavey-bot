import { t } from "@/core/translations";
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
  description: t("productivity.schedule.desc"),
  groupOnly: true,
  adminOnly: true,
  handler: async (_sock, msg) => {
    const sub = msg.args[0]?.toLowerCase();

    if (sub === "add") {
      // .schedule add 30m|daily Pesan yang akan dikirim
      const parts = msg.args.slice(1).join(" ").split("|");
      if (parts.length < 2) return msg.reply(t("productivity.schedule.addFormat"));

      const timeStr = parts[0]?.trim() ?? "";
      const message = parts.slice(1).join("|").trim();
      if (!message) return msg.reply(t("productivity.schedule.emptyMessage"));

      const triggerAt = parseTime(timeStr);
      if (!triggerAt) return msg.reply(t("productivity.schedule.invalidTime"));

      addSchedule(msg.jid, msg.sender, message, triggerAt);
      const date = new Date(triggerAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      await msg.reply(t("productivity.schedule.added", { date, message }));
    } else if (sub === "list") {
      const schedules = getSchedules(msg.jid);
      if (!schedules.length) return msg.reply(t("productivity.schedule.empty"));
      const list = schedules
        .map((s, i) => {
          const date = new Date(s.triggerAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
          return `${i + 1}. [ID:${s.id}] ⏰ ${date}\n   💬 "${s.message}"`;
        })
        .join("\n\n");
      await msg.reply(t("productivity.schedule.list", { list }));
    } else if (sub === "del") {
      const id = Number.parseInt(msg.args[1] ?? "", 10);
      if (!id) return msg.reply(t("productivity.schedule.delFormat"));
      deleteSchedule(id);
      await msg.reply(t("productivity.schedule.deleted", { id: String(id) }));
    } else {
      await msg.reply(t("productivity.schedule.help"));
    }
  },
});
