import { readFileSync } from "node:fs";
import { join } from "node:path";
import { addXp } from "@/infra/database";
import { getRandomItem } from "@/utils/helper";
import { logger } from "@/core/logger";
import { defineCommand } from "@/core/types";

const sessions = new Map<string, { answer: string; timeout: Timer; sender?: string }>();

let localData: { soal: string; jawaban: string }[] = [];
try {
  localData = JSON.parse(
    readFileSync(join(import.meta.dir, "..", "..", "data", "games", "tekateki.json"), "utf-8"),
  );
} catch (_e) {
  logger.error("tekateki.json error");
}

export default defineCommand({
  name: "tekateki",
  description: "Game teka-teki",
  handler: async (sock, msg) => {
    if (sessions.has(msg.jid)) return msg.reply("⏳ Selesaikan soal sebelumnya!");
    if (!localData.length) return msg.reply("❌ Data kosong.");

    const item = getRandomItem(localData);
    const jid = msg.jid;
    const timeout = setTimeout(() => {
      sessions.delete(jid);
      sock.sendMessage(jid, { text: `⏰ Habis! Jawabannya: *${item.jawaban}*` });
    }, 60000);

    sessions.set(jid, { answer: item.jawaban.toLowerCase(), timeout, sender: msg.sender });
    await msg.reply(`🧩 *Teka-Teki*\n\nSoal: ${item.soal}\n\nWaktu 60s!`);
  },
});

export function checkTekaTeki(jid: string, text: string, sender: string): string | null {
  const session = sessions.get(jid);
  if (!session) return null;
  if (!jid.endsWith("@g.us") && sender !== session.sender) return null;
  if (text.toLowerCase() !== session.answer) return null;
  clearTimeout(session.timeout);
  sessions.delete(jid);
  addXp(sender, 15);
  return `✅ Benar! (+15 XP)`;
}
