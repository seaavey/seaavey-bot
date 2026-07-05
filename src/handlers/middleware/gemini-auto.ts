import { downloadMediaMessage, type WAMessage } from "baileys";
import { TtlMap } from "@/utils/ttl-map";
import { config } from "@/core/config";
import type { MessageMiddleware } from "@/handlers/message-context";

const BASE = "https://www.00cc.eu.cc/gemini";

/** Active auto-AI sessions (TTL 5 min). Exported so gemini command can toggle. */
export const geminiAutoSessions = new TtlMap<string, true>(5 * 60 * 1000);

export const geminiAutoMiddleware: MessageMiddleware = async (ctx) => {
  const { sock, raw, parse } = ctx;

  // Private only — groups never auto-respond
  if (parse.isGroup) return "next";
  // Don't intercept prefixed commands
  if (config.prefix.some((p) => parse.body.startsWith(p))) return "next";

  const sender = parse.sender.replace(/@.+/, "");
  if (!geminiAutoSessions.has(sender)) return "next";

  const session = "SE" + sender;
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
