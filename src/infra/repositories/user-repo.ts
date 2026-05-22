import db, { safeMigrate } from "@/infra/db/client";
import { getRandomNumber } from "@/utils/helper";

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    jid TEXT PRIMARY KEY,
    hits INTEGER DEFAULT 0,
    banned INTEGER DEFAULT 0,
    lastChat INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1
  )
`);

safeMigrate("ALTER TABLE users ADD COLUMN lastChat INTEGER DEFAULT 0");
safeMigrate("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0");
safeMigrate("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1");

export function getUser(jid: string) {
  return db.query("SELECT * FROM users WHERE jid = ?").get(jid) as {
    jid: string;
    hits: number;
    banned: number;
    lastChat: number;
    xp: number;
    level: number;
  } | null;
}

export function addXp(jid: string, amount: number): boolean {
  db.run("INSERT INTO users (jid, xp) VALUES (?, ?) ON CONFLICT(jid) DO UPDATE SET xp = xp + ?", [
    jid,
    amount,
    amount,
  ]);
  const user = getUser(jid);
  if (!user) return false;
  const nextLevel = user.level * 100;
  if (user.xp >= nextLevel) {
    db.run("UPDATE users SET level = level + 1, xp = xp - ? WHERE jid = ?", [nextLevel, jid]);
    return true;
  }
  return false;
}

export function addHit(jid: string) {
  db.run(
    "INSERT INTO users (jid, hits, lastChat) VALUES (?, 1, ?) ON CONFLICT(jid) DO UPDATE SET hits = hits + 1, lastChat = ?",
    [jid, Date.now(), Date.now()],
  );
  addXp(jid, getRandomNumber(1, 5));
}

export function setLevel(jid: string, level: number) {
  db.run(
    "INSERT INTO users (jid, level) VALUES (?, ?) ON CONFLICT(jid) DO UPDATE SET level = EXCLUDED.level",
    [jid, level],
  );
}

export function addLevel(jid: string, amount: number) {
  db.run(
    "INSERT INTO users (jid, level) VALUES (?, ?) ON CONFLICT(jid) DO UPDATE SET level = level + EXCLUDED.level",
    [jid, amount],
  );
}

export function setXp(jid: string, xp: number) {
  db.run(
    "INSERT INTO users (jid, xp) VALUES (?, ?) ON CONFLICT(jid) DO UPDATE SET xp = EXCLUDED.xp",
    [jid, xp],
  );
}

export function addXpManual(jid: string, amount: number) {
  db.run(
    "INSERT INTO users (jid, xp) VALUES (?, ?) ON CONFLICT(jid) DO UPDATE SET xp = xp + EXCLUDED.xp",
    [jid, amount],
  );
}

export function setBanned(jid: string, banned: boolean) {
  db.run(
    "INSERT INTO users (jid, banned) VALUES (?, ?) ON CONFLICT(jid) DO UPDATE SET banned = ?",
    [jid, +banned, +banned],
  );
}

export function isBanned(jid: string): boolean {
  const row = db.query("SELECT banned FROM users WHERE jid = ?").get(jid) as {
    banned: number;
  } | null;
  return row?.banned === 1;
}
