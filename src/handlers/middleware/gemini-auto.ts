import { TtlMap } from "@/utils/ttl-map";
import type { MessageMiddleware } from "@/handlers/message-context";

const BASE = "https://www.00cc.eu.cc/gemini";

/** Active auto-AI sessions (TTL 5 min). Exported so gemini command can toggle. */
export const geminiAutoSessions = new TtlMap<string, true>(5 * 60 * 1000);

/** Current session ID per user. Key=number, Value=sessionId */
export const geminiSessions = new Map<string, string>();

export function getSessionId(sender: string): string {
  let sid = geminiSessions.get(sender);
  if (!sid) {
    sid = "SE" + sender;
    geminiSessions.set(sender, sid);
  }
  return sid;
}

export function newSessionId(sender: string): string {
  const sid = `SE${sender}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  geminiSessions.set(sender, sid);
  return sid;
}

export const geminiAutoMiddleware: MessageMiddleware = async (ctx) => {
  const { parse } = ctx;

  // Private only — groups never auto-respond
  if (parse.isGroup) return "next";
  // Don't process bot's own messages (prevents infinite loop)
  if (parse.fromMe) return "next";
  // Don't intercept commands
  if (parse.isCommand) return "next";

  const sender = parse.sender.replace(/@.+/, "");
  if (!geminiAutoSessions.has(sender)) return "next";

  const session = getSessionId(sender);
  let url = `${BASE}?sessions=${encodeURIComponent(session)}&message=${encodeURIComponent(parse.body || ".")}`;

  // ── Image support ────────────────────────────────────
  const imageMedia = parse.findMedia("imageMessage");
  if (imageMedia) {
    try {
      const buffer = await imageMedia.download();
      const b64 = buffer.toString("base64");
      url += `&image=${encodeURIComponent(b64)}`;
    } catch {
      // fall back to text-only if download fails
    }
  }

  await parse.reply("💬 *Auto AI is thinking...*");

  try {
    const res = await fetch(url);
    const json = (await res.json()) as { success?: boolean; response?: string };
    if (json.success && json.response) {
      await parse.reply(json.response);
    }
  } catch {
    await parse.reply("❌ Gagal merespons.");
  }

  return "stop";
};
