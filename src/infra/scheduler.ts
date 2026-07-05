import type { WASocket } from "baileys";
import { logger } from "@/core/logger";
import {
  getPendingReminders,
  getPendingSchedules,
  markReminderDone,
  markScheduleDone,
} from "@/infra/database";
import { getNumber } from "@/utils/helper";

let pollInterval: ReturnType<typeof setInterval> | null = null;

export function startSchedulers(sock: WASocket) {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  pollInterval = setInterval(async () => {
    try {
      const reminders = getPendingReminders();
      for (const r of reminders) {
        try {
          await sock.sendMessage(r.chatJid, {
            text: `⏰ *Reminder!*\n\n@${getNumber(r.jid)}: ${r.message}`,
            mentions: [r.jid],
          });
          markReminderDone(r.id);
        } catch (e) {
          logger.error({ err: e, reminderId: r.id }, "Scheduler error (reminder)");
        }
      }
    } catch (e) {
      logger.error({ err: e }, "Scheduler query failed (reminder)");
    }

    try {
      const schedules = getPendingSchedules();
      for (const s of schedules) {
        try {
          await sock.sendMessage(s.chatJid, {
            text: `📢 *Scheduled Message*\n\n${s.message}`,
          });
          markScheduleDone(s.id);
        } catch (e) {
          logger.error({ err: e, scheduleId: s.id }, "Scheduler error (schedule)");
        }
      }
    } catch (e) {
      logger.error({ err: e }, "Scheduler query failed (schedule)");
    }
  }, 30_000);
}
