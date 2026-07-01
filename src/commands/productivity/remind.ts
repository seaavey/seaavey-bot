import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { addReminder } from "@/infra/database";

export default defineCommand({
  name: "Remind",
  alias: ["rmd", "remind"],
  description: t("productivity.remind.desc"),
  handler: async (_sock, msg) => {
    const timeStr = msg.args[0];
    const message = msg.args.slice(1).join(" ");
    if (!timeStr || !message) return msg.reply(t("productivity.remind.format"));

    const match = timeStr.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return msg.reply(t("productivity.remind.invalidTime"));

    const num = match[1] as string;
    const unit = match[2] as string;
    const multiplier: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const ms = parseInt(num, 10) * (multiplier[unit] ?? 60000);
    if (ms > 7 * 86400000) return msg.reply(t("productivity.remind.maxDays"));

    const triggerAt = Date.now() + ms;
    addReminder(msg.sender, msg.jid, message, triggerAt);
    await msg.reply(t("productivity.remind.set", { time: timeStr, message }));
  },
});
