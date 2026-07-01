import id from "@/data/lang/id.json";
import en from "@/data/lang/en.json";
import { config } from "./config";

const strings: Record<string, unknown> = config.lang === "en" ? en : id;

function lookup(obj: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function t(
  key: string,
  params?: Record<string, string | number | undefined | null>,
): string {
  let text = lookup(strings, key);
  if (text === undefined) {
    text = `{${key}}`;
  }
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, `${v ?? ""}`);
    }
  }
  return text;
}
