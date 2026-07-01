import { defineCommand } from "@/core/types";
import { addReminder } from "@/infra/database";

export default defineCommand({
  name: "Remind",
  alias: ["rmd", "remind"],
  description: "Set reminder. Example: .remind 30m Lunch",
  handler: async (_sock, msg) => {
    const timeStr = msg.args[0];
    const message = msg.args.slice(1).join(" ");
    if (!timeStr || !message) return msg.reply("Format: .remind <time> <message>");

    const match = timeStr.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return msg.reply("Invalid time format. Use: 10s, 5m, 2h, 1d");

    const num = match[1] as string;
    const unit = match[2] as string;
    const multiplier: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const ms = parseInt(num, 10) * (multiplier[unit] ?? 60000);
    if (ms > 7 * 86400000) return msg.reply("🚩 Max 7 days.");

    const triggerAt = Date.now() + ms;
    addReminder(msg.sender, msg.jid, message, triggerAt);
    await msg.reply(`⏰ Reminder set! You will be reminded in ${timeStr}.
📝 ${message}`);
  },
});
