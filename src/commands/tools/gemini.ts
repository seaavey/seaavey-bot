import { defineCommand } from "@/core/types";
import { geminiAutoSessions, getSessionId, newSessionId } from "@/handlers/middleware/gemini-auto";

const BASE = "https://www.00cc.eu.cc/gemini";

export default defineCommand({
  name: "Gemini AI",
  alias: ["gemini", "ai"],
  description:
    "Chat AI (text/vision) & image generation via Free Gemini API.\n" +
    "Usage:\n" +
    "  .gemini <teks> — chat teks (auto-activate AI session 5 menit)\n" +
    "  .gemini <teks> (reply foto) — chat + analisa gambar\n" +
    "  .gemini --img <prompt> [--ar 1:1|4:3|16:9|3:2] — generate gambar\n" +
    "  .gemini --new — buat session baru (reset percakapan)\n" +
    "  .gemini --stop — matikan auto-AI session",
  handler: async (sock, msg) => {
    const text = msg.text.trim();
    const sender = msg.sender.replace(/@.+/, "");

    // ── New session ─────────────────────────────────────
    if (text === "--new") {
      const sid = newSessionId(sender);
      return msg.reply(`🆕 *Session baru!*\nID: \`${sid}\`\nPercakapan sebelumnya di-reset.`);
    }

    // ── Stop auto-AI ────────────────────────────────────
    if (text === "--stop") {
      geminiAutoSessions.delete(sender);
      return msg.reply("🚫 *Auto-AI dimatikan.*");
    }

    const isImageGen = text.startsWith("--img");
    const imageMedia = msg.findMedia("imageMessage");

    if (!text && !imageMedia)
      return msg.reply(
        "❌ Format: .gemini <pesan> | .gemini --img <prompt> | .gemini --new | .gemini --stop",
      );

    // ── Generate image ──────────────────────────────────
    if (isImageGen) {
      const rest = text.slice(5).trim();
      if (!rest) return msg.reply("❌ .gemini --img <prompt> [--ar ratio]");

      let prompt = rest;
      let aspectRatio = "1:1";
      const arMatch = rest.match(/--ar\s+(\S+)/);
      if (arMatch) {
        aspectRatio = arMatch[1] ?? "1:1";
        prompt = rest.replace(/--ar\s+\S+/, "").trim();
      }
      if (!prompt) return msg.reply("❌ Prompt tidak boleh kosong");

      await msg.reply("🎨 *Generating image...*");
      const url = `${BASE}?action=generate_image&message=${encodeURIComponent(prompt)}&aspectRatio=${encodeURIComponent(aspectRatio)}`;

      try {
        const res = await fetch(url);
        const json = (await res.json()) as { success?: boolean; image?: string };
        if (!json.success || !json.image) return msg.reply("❌ Gagal generate gambar.");
        const buf = Buffer.from(json.image.replace(/^data:image\/\w+;base64,/, ""), "base64");
        await msg.send({ image: buf, caption: `🎨 *${prompt}*` });
      } catch {
        await msg.reply("❌ Gagal menghubungi API.");
      }
      return;
    }

    // ── Vision (reply to image) ──────────────────────────
    let imageBase64: string | undefined;
    if (imageMedia) {
      try {
        await msg.reply("⏳ *Processing image...*");
        const buffer = await imageMedia.download();
        imageBase64 = buffer.toString("base64");
      } catch {
        return msg.reply("❌ Gagal download gambar.");
      }
    }

    // ── Text / Vision chat ──────────────────────────────
    const session = getSessionId(sender);
    let url = `${BASE}?sessions=${encodeURIComponent(session)}&message=${encodeURIComponent(text || ".")}`;
    if (imageBase64) url += `&image=${encodeURIComponent(imageBase64)}`;

    await msg.reply(text ? "💬 *Gemini is thinking...*" : "💬 *Analyzing image...*");

    try {
      const res = await fetch(url);
      const json = (await res.json()) as { success?: boolean; response?: string; error?: string };
      if (!json.success) return msg.reply(`❌ ${json.error || "Gagal merespons."}`);
      await msg.reply(json.response || "_(no response)_");
    } catch {
      await msg.reply("❌ Gagal menghubungi API.");
    }

    // Auto-activate: next 5 menit chat private (no prefix) langsung dijawab AI
    if (!msg.isGroup) {
      geminiAutoSessions.set(sender, true);
    }
  },
});
