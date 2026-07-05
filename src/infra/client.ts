import { Database } from "bun:sqlite";
import { logger } from "@/core/logger";

const db = new Database("data.db");
db.run("PRAGMA journal_mode = WAL");

export function safeMigrate(sql: string) {
  try {
    db.run(sql);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!message.includes("duplicate column name")) {
      logger.error({ err: e, sql }, "Migration failed");
    }
  }
}

export default db;
