import { readFileSync } from "node:fs";
import { join } from "node:path";
import { addXp } from "@/infra/database";
import { getRandomItem } from "@/utils/helper";
import { logger } from "@/core/logger";
import { defineCommand } from "@/core/types";

// Load local database
let localData: { soal: string; jawaban: string[] }[] = [];
try {
  const fileContent = readFileSync(
    join(import.meta.dir, "..", "..", "data", "games", "family100.json"),
    "utf-8",
  );
  localData = JSON.parse(fileContent);
} catch (_e) {
  logger.error("Local family100.json not found or invalid.");
}

const sessions = new Map<
  string,
  {
    question: string;
    answers: string[];
    answered: string[];
    timeout: Timer;
  }
>();

export default defineCommand({
  name: "family100",
  description: "Main game family 100 bareng di grup",
  handler: async (sock, msg) => {
    if (!msg.isGroup) {
      return msg.reply("❌ Game ini hanya bisa dimainkan di grup!");
    }

    if (sessions.has(msg.jid)) {
      return msg.reply("⏳ Masih ada sesi family 100 yang sedang berjalan di grup ini!");
    }

    if (localData.length === 0) {
      return msg.reply("❌ Data soal family 100 belum tersedia.");
    }

    const surveyData = getRandomItem(localData) as (typeof localData)[number];
    const jid = msg.jid;
    const question = surveyData.soal;
    const answers = surveyData.jawaban.map((a) => a.toLowerCase().trim());

    const timeout = setTimeout(() => {
      const session = sessions.get(jid);
      if (session) {
        sessions.delete(jid);
        const unanswered = session.answers.filter((a) => !session.answered.includes(a));
        let text = `⏰ Waktu habis!\n\n*Jawaban yang belum tertebak:*\n`;
        unanswered.forEach((a, i) => {
          text += `${i + 1}. ${a}\n`;
        });
        sock.sendMessage(jid, { text: text.trim() });
      }
    }, 120_000); // 2 minutes

    sessions.set(jid, {
      question,
      answers,
      answered: [],
      timeout,
    });

    let text = `🎯 *FAMILY 100* 🎯\n\n*Pertanyaan:* ${question}\n\n`;
    text += `Terdapat *${answers.length}* jawaban.\n`;
    text += `Ketik jawaban langsung di grup ini. Waktu 2 menit!\n\n`;
    answers.forEach((_, i) => {
      text += `${i + 1}. ⬛⬛⬛⬛⬛\n`;
    });

    await msg.reply(text.trim());
  },
});

export function checkFamily100(jid: string, text: string, sender: string): string | null {
  const session = sessions.get(jid);
  if (!session) return null;

  const answer = text.toLowerCase().trim();
  const index = session.answers.indexOf(answer);

  if (index !== -1) {
    if (session.answered.includes(answer)) {
      return `⚠️ Jawaban *${answer}* sudah ditebak sebelumnya!`;
    }

    session.answered.push(answer);
    addXp(sender, 50);

    if (session.answered.length === session.answers.length) {
      clearTimeout(session.timeout);
      sessions.delete(jid);
      return `🎉 *PERFECT!* Semua jawaban berhasil ditebak! (+50 XP)\n\nJawaban terakhir: *${answer}*`;
    }

    let board = `🎯 *FAMILY 100* 🎯\n\n*Pertanyaan:* ${session.question}\n\n`;
    session.answers.forEach((ans, i) => {
      if (session.answered.includes(ans)) {
        board += `${i + 1}. ${ans} ✅\n`;
      } else {
        board += `${i + 1}. ⬛⬛⬛⬛⬛\n`;
      }
    });

    board += `\nBenar! *${answer}* (+50 XP)`;
    return board.trim();
  }

  return null;
}
