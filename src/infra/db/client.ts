import { Database } from "bun:sqlite";

const db = new Database("data.db");

db.run("PRAGMA journal_mode = WAL");

export function safeMigrate(sql: string) {
  try {
    db.run(sql);
  } catch {}
}

export default db;
