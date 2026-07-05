import { downloadMediaMessage, type WAMessage } from "baileys";
import { TtlMap } from "@/utils/ttl-map";
import { config } from "@/core/config";
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
  const { sock, raw, parse } = ctx;

  // Private only — groups never auto-respond
  if (parse.isGroup) return "next";
  // Don't process bot's own messages (prevents infinite loop)
  if (parse.fromMe) return "next";
  // Don't intercept prefixed commands
  if (config.prefix.some((p) => parse.body.startsWith(p))) return "next";

  const sender = parse.sender.replace(/@.+/, "");
  if (!geminiAutoSessions.has(sender)) return "next";

  const session = getSessionId(sender);
  let url = `${BASE}?sessions=${encodeURIComponent(session)}&message=${encodeURIComponent(parse.body || ".")}`;

  // ── Image support ────────────────────────────────────
  const imgMsg = parse.message?.imageMessage;
  if (imgMsg) {
    try {
      const buffer = (await downloadMediaMessage({ key: raw.key, message: { imageMessage: imgMsg } } as WAMessage, "buffer", {
        host: "mmg.whatsapp.net",
      })) as Buffer;
      const b64 = buffer.toString("base64");
      url += `&image=${encodeURIComponent(b64)}`;
    } catch {
      // fall back to text-only if download fails
    }
  }

  await sock.sendMessage(parse.jid, { text: "💬 *Auto AI is thinking...*" }, { quoted: raw });

  try {
    const res = await fetch(url);
    const json = await res.json() as { success?: boolean; response?: string };
    if (json.success && json.response) {
      await sock.sendMessage(parse.jid, { text: json.response }, { quoted: raw });
    }
  } catch {
    await sock.sendMessage(parse.jid, { text: "❌ Gagal merespons." }, { quoted: raw });
  }

  return "stop";
};
