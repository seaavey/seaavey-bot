import db from "@/infra/db/client";

db.run(`
  CREATE TABLE IF NOT EXISTS afk (
    jid TEXT PRIMARY KEY,
    reason TEXT DEFAULT '',
    timestamp INTEGER DEFAULT 0
  )
`);

export function setAfk(jid: string, reason: string) {
  db.run("INSERT OR REPLACE INTO afk (jid, reason, timestamp) VALUES (?, ?, ?)", [
    jid,
    reason,
    Date.now(),
  ]);
}

export function getAfk(jid: string) {
  return db.query("SELECT * FROM afk WHERE jid = ?").get(jid) as {
    jid: string;
    reason: string;
    timestamp: number;
  } | null;
}

export function removeAfk(jid: string) {
  db.run("DELETE FROM afk WHERE jid = ?", [jid]);
}
