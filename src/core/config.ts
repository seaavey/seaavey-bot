import { readFileSync } from "node:fs";
import { join } from "node:path";

export const isDev = process.env.NODE_ENV !== "production";

interface Config {
  name: string;
  prefix: string;
  owner: string[];
  apiKey: string;
  toxicRegex: RegExp;
}

const toxicWords = readFileSync(join(import.meta.dir, "..", "assets", "toxic.txt"), "utf-8")
  .split("\n")
  .filter((w) => w.trim())
  .map((w) => w.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) // escape regex special chars
  .join("|");

export const config: Config = {
  name: "SeaaveyBot",
  prefix: ".",
  owner: (process.env.OWNER_NUMBER ?? "62123456789").split(","),
  apiKey: process.env.API_KEY ?? "",
  toxicRegex: new RegExp(`\\b(?:${toxicWords})\\b`, "i"),
};
