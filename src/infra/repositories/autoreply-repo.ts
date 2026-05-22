import db from "@/infra/db/client";

db.run(`
  CREATE TABLE IF NOT EXISTS autoreplies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupJid TEXT,
    trigger TEXT,
    response TEXT,
    createdBy TEXT
  )
`);

export function addAutoReply(
  groupJid: string,
  trigger: string,
  response: string,
  createdBy: string,
) {
  db.run("INSERT INTO autoreplies (groupJid, trigger, response, createdBy) VALUES (?, ?, ?, ?)", [
    groupJid,
    trigger.toLowerCase(),
    response,
    createdBy,
  ]);
}

export function removeAutoReply(groupJid: string, trigger: string): boolean {
  const result = db.run("DELETE FROM autoreplies WHERE groupJid = ? AND trigger = ?", [
    groupJid,
    trigger.toLowerCase(),
  ]);
  return result.changes > 0;
}

export function getAutoReplies(groupJid: string) {
  return db.query("SELECT * FROM autoreplies WHERE groupJid = ?").all(groupJid) as {
    id: number;
    trigger: string;
    response: string;
    createdBy: string;
  }[];
}

export function findAutoReply(groupJid: string, text: string) {
  return db
    .query("SELECT response FROM autoreplies WHERE groupJid = ? AND trigger = ?")
    .get(groupJid, text.toLowerCase()) as { response: string } | null;
}
