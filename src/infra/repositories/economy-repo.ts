import db from "@/infra/client";

db.run(`
  CREATE TABLE IF NOT EXISTS economy (
    jid TEXT PRIMARY KEY,
    wallet INTEGER DEFAULT 0,
    bank INTEGER DEFAULT 0,
    lastDaily INTEGER DEFAULT 0
  )
`);

function ensureEconomy(jid: string) {
  db.run("INSERT OR IGNORE INTO economy (jid) VALUES (?)", [jid]);
}

export function getEconomy(jid: string) {
  ensureEconomy(jid);
  return db.query("SELECT * FROM economy WHERE jid = ?").get(jid) as {
    jid: string;
    wallet: number;
    bank: number;
    lastDaily: number;
  };
}

export function creditWallet(jid: string, amount: number) {
  if (amount <= 0) throw new Error("Wallet credit amount must be positive.");
  ensureEconomy(jid);
  db.run("UPDATE economy SET wallet = wallet + ? WHERE jid = ?", [amount, jid]);
}

const debitWalletTransaction = db.transaction((jid: string, amount: number): boolean => {
  const account = getEconomy(jid);
  if (account.wallet < amount) return false;

  db.run("UPDATE economy SET wallet = wallet - ? WHERE jid = ?", [amount, jid]);
  return true;
});

export function debitWallet(jid: string, amount: number): boolean {
  if (amount <= 0) return false;
  return debitWalletTransaction(jid, amount);
}

export function setLastDaily(jid: string) {
  db.run("UPDATE economy SET lastDaily = ? WHERE jid = ?", [Date.now(), jid]);
}

const transferMoneyTransaction = db.transaction(
  (from: string, to: string, amount: number): boolean => {
    const sender = getEconomy(from);
    if (sender.wallet < amount) return false;

    ensureEconomy(to);
    db.run("UPDATE economy SET wallet = wallet - ? WHERE jid = ?", [amount, from]);
    db.run("UPDATE economy SET wallet = wallet + ? WHERE jid = ?", [amount, to]);
    return true;
  },
);

export function transferMoney(from: string, to: string, amount: number): boolean {
  if (amount <= 0) return false;
  if (from === to) return false;

  return transferMoneyTransaction(from, to, amount);
}
