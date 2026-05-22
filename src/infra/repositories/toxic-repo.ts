import db from "@/infra/db/client";

db.run(`
  CREATE TABLE IF NOT EXISTS toxic_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupJid TEXT,
    word TEXT
  )
`);

export function addToxicWord(groupJid: string, word: string) {
  db.run("INSERT INTO toxic_words (groupJid, word) VALUES (?, ?)", [groupJid, word.toLowerCase()]);
}

export function removeToxicWord(groupJid: string, word: string): boolean {
  const result = db.run("DELETE FROM toxic_words WHERE groupJid = ? AND word = ?", [
    groupJid,
    word.toLowerCase(),
  ]);
  return result.changes > 0;
}

export function getToxicWords(groupJid: string) {
  return db.query("SELECT word FROM toxic_words WHERE groupJid = ?").all(groupJid) as {
    word: string;
  }[];
}

export function isToxicMessage(groupJid: string, text: string): string | null {
  const words = db.query("SELECT word FROM toxic_words WHERE groupJid = ?").all(groupJid) as {
    word: string;
  }[];
  const lower = text.toLowerCase();

  for (const { word } of words) {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(lower)) return word;
  }
  return null;
}
