import db, { safeMigrate } from "@/infra/db/client";

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
    antiviewonce INTEGER DEFAULT 0
  )
`);

safeMigrate("ALTER TABLE groups ADD COLUMN antiviewonce INTEGER DEFAULT 0");

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

db.run(`
  CREATE TABLE IF NOT EXISTS group_members (
    groupJid TEXT,
    memberJid TEXT,
    lastChat INTEGER DEFAULT 0,
    chatCount INTEGER DEFAULT 0,
    PRIMARY KEY (groupJid, memberJid)
  )
`);

safeMigrate("ALTER TABLE group_members ADD COLUMN chatCount INTEGER DEFAULT 0");

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
