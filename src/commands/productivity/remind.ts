import { addReminder } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "remind",
  description: "Set pengingat. Contoh: .remind 30m Makan siang",
  handler: async (_sock, msg) => {
    const timeStr = msg.args[0];
    const message = msg.args.slice(1).join(" ");
    if (!timeStr || !message)
      return msg.reply(
        "Format: .remind <waktu> <pesan>\nContoh: .remind 30m Makan siang\nWaktu: 10s, 5m, 2h, 1d",
      );

    const match = timeStr.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return msg.reply("Format waktu salah. Gunakan: 10s, 5m, 2h, 1d");

    const num = match[1] as string;
    const unit = match[2] as string;
    const multiplier: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const ms = parseInt(num, 10) * (multiplier[unit] ?? 60000);
    if (ms > 7 * 86400000) return msg.reply("❌ Maksimal 7 hari.");

    const triggerAt = Date.now() + ms;
    addReminder(msg.sender, msg.jid, message, triggerAt);
    await msg.reply(`⏰ Reminder diset! Akan diingatkan dalam ${timeStr}.\n📝 ${message}`);
  },
});
