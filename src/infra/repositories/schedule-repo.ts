import db from "@/infra/db/client";

db.run(`
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT,
    chatJid TEXT,
    message TEXT,
    triggerAt INTEGER,
    done INTEGER DEFAULT 0
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chatJid TEXT,
    creator TEXT,
    message TEXT,
    triggerAt INTEGER,
    repeat TEXT DEFAULT '',
    done INTEGER DEFAULT 0
  )
`);

export function addReminder(jid: string, chatJid: string, message: string, triggerAt: number) {
  db.run("INSERT INTO reminders (jid, chatJid, message, triggerAt) VALUES (?, ?, ?, ?)", [
    jid,
    chatJid,
    message,
    triggerAt,
  ]);
}

export function getPendingReminders() {
  return db.query("SELECT * FROM reminders WHERE done = 0 AND triggerAt <= ?").all(Date.now()) as {
    id: number;
    jid: string;
    chatJid: string;
    message: string;
    triggerAt: number;
  }[];
}

export function markReminderDone(id: number) {
  db.run("UPDATE reminders SET done = 1 WHERE id = ?", [id]);
}

export function addSchedule(
  chatJid: string,
  creator: string,
  message: string,
  triggerAt: number,
  repeat = "",
) {
  db.run(
    "INSERT INTO schedules (chatJid, creator, message, triggerAt, repeat) VALUES (?, ?, ?, ?, ?)",
    [chatJid, creator, message, triggerAt, repeat],
  );
}

export function getPendingSchedules() {
  return db.query("SELECT * FROM schedules WHERE done = 0 AND triggerAt <= ?").all(Date.now()) as {
    id: number;
    chatJid: string;
    creator: string;
    message: string;
    triggerAt: number;
    repeat: string;
  }[];
}

export function markScheduleDone(id: number) {
  db.run("UPDATE schedules SET done = 1 WHERE id = ?", [id]);
}

export function reschedule(id: number, nextTrigger: number) {
  db.run("UPDATE schedules SET triggerAt = ? WHERE id = ?", [nextTrigger, id]);
}

export function getSchedules(chatJid: string) {
  return db.query("SELECT * FROM schedules WHERE chatJid = ? AND done = 0").all(chatJid) as {
    id: number;
    message: string;
    triggerAt: number;
    repeat: string;
  }[];
}

export function deleteSchedule(id: number) {
  db.run("DELETE FROM schedules WHERE id = ?", [id]);
}
