import { readFileSync } from "node:fs";
import { join } from "node:path";
import { logger } from "@/core/logger";

export function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getNumber(jid: string): string {
  return jid.replace(/@.+/, "");
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h > 0 ? `${h} jam ` : ""}${m > 0 ? `${m} menit ` : ""}${s} detik`;
}

const GAMES_DATA_DIR = join(process.cwd(), "src", "game", "data", "games");

export function loadGameData<T>(filename: string): T[] {
  try {
    const raw = readFileSync(join(GAMES_DATA_DIR, filename), "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    logger.error(`Failed to load ${filename}`);
    return [];
  }
}

/**
 * Fetches a URL and returns parsed JSON, or null on failure.
 * Eliminates repeated res.ok ↔ res.json() ↔ null-check boilerplate
 * across 14 bare-fetch commands.
 */
export async function safeFetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
