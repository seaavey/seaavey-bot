import db from "@/infra/db/client";

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
