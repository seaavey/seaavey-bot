import db from "@/infra/db/client";

db.run(`
  CREATE TABLE IF NOT EXISTS warns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupJid TEXT,
    memberJid TEXT,
    reason TEXT DEFAULT '',
    timestamp INTEGER DEFAULT 0
  )
`);

export function addWarn(groupJid: string, memberJid: string, reason: string) {
  db.run("INSERT INTO warns (groupJid, memberJid, reason, timestamp) VALUES (?, ?, ?, ?)", [
    groupJid,
    memberJid,
    reason,
    Date.now(),
  ]);
}

export function getWarns(groupJid: string, memberJid: string) {
  return db
    .query("SELECT * FROM warns WHERE groupJid = ? AND memberJid = ?")
    .all(groupJid, memberJid) as { id: number; reason: string; timestamp: number }[];
}

export function removeWarns(groupJid: string, memberJid: string) {
  db.run("DELETE FROM warns WHERE groupJid = ? AND memberJid = ?", [groupJid, memberJid]);
}
