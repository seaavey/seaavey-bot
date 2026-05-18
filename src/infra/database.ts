import { Database } from "bun:sqlite";

import { getRandomNumber } from "@/utils/helper";

const db = new Database("data.db");

db.run("PRAGMA journal_mode = WAL");
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

// migrate: add columns if missing
try {
  db.run("ALTER TABLE users ADD COLUMN lastChat INTEGER DEFAULT 0");
} catch {}
try {
  db.run("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0");
} catch {}
try {
  db.run("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1");
} catch {}

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

// ======= Groups =======

db.run(`
  CREATE TABLE IF NOT EXISTS groups (
    jid TEXT PRIMARY KEY,
    name TEXT DEFAULT '',
    welcome INTEGER DEFAULT 0,
    goodbye INTEGER DEFAULT 0,
    antilink INTEGER DEFAULT 0,
    antidelete INTEGER DEFAULT 0,
    antispam INTEGER DEFAULT 0,
    antitoxic INTEGER DEFAULT 0,
    mute INTEGER DEFAULT 0,
    autosticker INTEGER DEFAULT 0,
    onlyAdmin INTEGER DEFAULT 0,
    welcomeMsg TEXT DEFAULT '',
    goodbyeMsg TEXT DEFAULT '',
    warnMax INTEGER DEFAULT 3,
    antinsfw INTEGER DEFAULT 0
  )
`);

try {
  db.run("ALTER TABLE groups ADD COLUMN antinsfw INTEGER DEFAULT 0");
} catch {}
try {
  db.run("ALTER TABLE groups ADD COLUMN antiviewonce INTEGER DEFAULT 0");
} catch {}

export interface Group {
  jid: string;
  name: string;
  welcome: number;
  goodbye: number;
  antilink: number;
  antidelete: number;
  antispam: number;
  antitoxic: number;
  mute: number;
  autosticker: number;
  onlyAdmin: number;
  welcomeMsg: string;
  goodbyeMsg: string;
  warnMax: number;
  antinsfw: number;
  antiviewonce: number;
}

export function getGroup(jid: string): Group {
  const row = db.query("SELECT * FROM groups WHERE jid = ?").get(jid) as Group | null;
  if (row) return row;
  db.run("INSERT OR IGNORE INTO groups (jid) VALUES (?)", [jid]);
  return db.query("SELECT * FROM groups WHERE jid = ?").get(jid) as Group;
}

export function setGroup(jid: string, key: keyof Omit<Group, "jid">, value: string | number) {
  db.run("INSERT OR IGNORE INTO groups (jid) VALUES (?)", [jid]);
  db.run(`UPDATE groups SET ${key} = ? WHERE jid = ?`, [value, jid]);
}

// ======= Group Members (lastChat tracking) =======

db.run(`
  CREATE TABLE IF NOT EXISTS group_members (
    groupJid TEXT,
    memberJid TEXT,
    lastChat INTEGER DEFAULT 0,
    chatCount INTEGER DEFAULT 0,
    PRIMARY KEY (groupJid, memberJid)
  )
`);

// Migration: add chatCount if missing
try {
  db.run("ALTER TABLE group_members ADD COLUMN chatCount INTEGER DEFAULT 0");
} catch {}

export function updateMemberChat(groupJid: string, memberJid: string) {
  db.run(
    "INSERT INTO group_members (groupJid, memberJid, lastChat, chatCount) VALUES (?, ?, ?, 1) ON CONFLICT(groupJid, memberJid) DO UPDATE SET lastChat = ?, chatCount = chatCount + 1",
    [groupJid, memberJid, Date.now(), Date.now()],
  );
}

export function getSiders(groupJid: string, days = 3) {
  const threshold = Date.now() - days * 86400000;
  return db
    .query("SELECT memberJid, lastChat FROM group_members WHERE groupJid = ? AND lastChat < ?")
    .all(groupJid, threshold) as { memberJid: string; lastChat: number }[];
}

// ======= AFK =======

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

// ======= Economy =======

db.run(`
  CREATE TABLE IF NOT EXISTS economy (
    jid TEXT PRIMARY KEY,
    wallet INTEGER DEFAULT 0,
    bank INTEGER DEFAULT 0,
    lastDaily INTEGER DEFAULT 0
  )
`);

export function getEconomy(jid: string) {
  db.run("INSERT OR IGNORE INTO economy (jid) VALUES (?)", [jid]);
  return db.query("SELECT * FROM economy WHERE jid = ?").get(jid) as {
    jid: string;
    wallet: number;
    bank: number;
    lastDaily: number;
  };
}

export function addWallet(jid: string, amount: number) {
  db.run("INSERT OR IGNORE INTO economy (jid) VALUES (?)", [jid]);
  db.run("UPDATE economy SET wallet = wallet + ? WHERE jid = ?", [amount, jid]);
}

export function setLastDaily(jid: string) {
  db.run("UPDATE economy SET lastDaily = ? WHERE jid = ?", [Date.now(), jid]);
}

export function transferMoney(from: string, to: string, amount: number): boolean {
  const sender = getEconomy(from);
  if (sender.wallet < amount) return false;
  db.run("UPDATE economy SET wallet = wallet - ? WHERE jid = ?", [amount, from]);
  addWallet(to, amount);
  return true;
}

// ======= Warn =======

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

// ======= Poll =======

db.run(`
  CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupJid TEXT,
    creator TEXT,
    question TEXT,
    options TEXT,
    votes TEXT DEFAULT '{}',
    active INTEGER DEFAULT 1,
    timestamp INTEGER DEFAULT 0
  )
`);

export function createPoll(groupJid: string, creator: string, question: string, options: string[]) {
  db.run(
    "INSERT INTO polls (groupJid, creator, question, options, votes, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    [groupJid, creator, question, JSON.stringify(options), JSON.stringify({}), Date.now()],
  );
  return db.query("SELECT last_insert_rowid() as id").get() as { id: number };
}

export function getPoll(groupJid: string) {
  return db
    .query("SELECT * FROM polls WHERE groupJid = ? AND active = 1 ORDER BY id DESC LIMIT 1")
    .get(groupJid) as {
    id: number;
    creator: string;
    question: string;
    options: string;
    votes: string;
    timestamp: number;
  } | null;
}

export function votePoll(pollId: number, voter: string, optionIndex: number) {
  const poll = db.query("SELECT votes FROM polls WHERE id = ?").get(pollId) as {
    votes: string;
  } | null;
  if (!poll) return false;
  const votes = JSON.parse(poll.votes) as Record<string, number>;
  votes[voter] = optionIndex;
  db.run("UPDATE polls SET votes = ? WHERE id = ?", [JSON.stringify(votes), pollId]);
  return true;
}

export function closePoll(pollId: number) {
  db.run("UPDATE polls SET active = 0 WHERE id = ?", [pollId]);
}

// ======= Scheduler =======

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

// ======= Auto-Reply =======

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

// ======= Scheduled Messages =======

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

export default db;

// ======= Toxic Words =======

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
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(lower)) return word;
  }
  return null;
}
