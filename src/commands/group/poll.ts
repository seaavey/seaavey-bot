import { closePoll, createPoll, getPoll, votePoll } from "@/infra/database";
import { type Button, sendInteractive } from "@/handlers/interactive";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "poll",
  description: "Buat/vote/tutup polling. Format: .poll Pertanyaan? | Opsi1 | Opsi2",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya untuk group.");
    const sub = msg.args[0];

    // Vote: .poll vote 1
    if (sub === "vote") {
      const poll = getPoll(msg.jid);
      if (!poll) return msg.reply("❌ Tidak ada poll aktif.");
      const votes = JSON.parse(poll.votes) as Record<string, number>;
      if (votes[msg.sender] !== undefined) return msg.reply("❌ Kamu sudah melakukan vote!");
      const idx = parseInt(msg.args[1] || "0", 10) - 1;
      const options = JSON.parse(poll.options) as string[];
      if (Number.isNaN(idx) || idx < 0 || idx >= options.length)
        return msg.reply(`❌ Pilih 1-${options.length}`);
      votePoll(poll.id, msg.sender, idx);
      return msg.reply(`✅ Vote kamu: ${options[idx]}`);
    }

    // Close: .poll close
    if (sub === "close") {
      if (!msg.isAdmin) return msg.reply("❌ Khusus admin.");
      const poll = getPoll(msg.jid);
      if (!poll) return msg.reply("❌ Tidak ada poll aktif.");
      closePoll(poll.id);
      const options = JSON.parse(poll.options) as string[];
      const votes = JSON.parse(poll.votes) as Record<string, number>;
      const counts = options.map((_, i) => Object.values(votes).filter((v) => v === i).length);
      const result = options.map((o, i) => `${i + 1}. ${o} — ${counts[i]} vote`).join("\n");
      return msg.reply(`📊 *Hasil Poll*\n\n❓ ${poll.question}\n\n${result}`);
    }

    // Result: .poll result
    if (sub === "result") {
      const poll = getPoll(msg.jid);
      if (!poll) return msg.reply("❌ Tidak ada poll aktif.");
      const options = JSON.parse(poll.options) as string[];
      const votes = JSON.parse(poll.votes) as Record<string, number>;
      const counts = options.map((_, i) => Object.values(votes).filter((v) => v === i).length);
      const result = options.map((o, i) => `${i + 1}. ${o} — ${counts[i]} vote`).join("\n");

      const buttons: Button[] = options.map((o, i) => ({
        name: "quick_reply",
        params: {
          display_text: o.slice(0, 20),
          id: `.poll vote ${i + 1}`,
        },
      }));

      return sendInteractive(sock, msg.jid, {
        body: `📊 *Poll Aktif*\n\n❓ ${poll.question}\n\n${result}`,
        footer: "Klik tombol di bawah untuk vote",
        buttons,
      });
    }

    // Create: .poll Question? | Option1 | Option2
    const text = msg.args.join(" ");
    const parts = text.split("|").map((s) => s.trim());
    if (parts.length < 3)
      return msg.reply(
        "Format: .poll Pertanyaan? | Opsi1 | Opsi2 | ...\n\nLainnya:\n.poll vote <nomor>\n.poll result\n.poll close",
      );
    const [question, ...options] = parts;
    const existing = getPoll(msg.jid);
    if (existing) return msg.reply("❌ Sudah ada poll aktif. Tutup dulu dengan .poll close");
    createPoll(msg.jid, msg.sender, question as string, options);

    const buttons: Button[] = options.map((o, i) => ({
      name: "quick_reply",
      params: {
        display_text: o.slice(0, 20),
        id: `.poll vote ${i + 1}`,
      },
    }));

    await sendInteractive(sock, msg.jid, {
      body: `📊 *Poll Dibuat!*\n\n❓ ${question}`,
      footer: "Klik tombol di bawah untuk vote",
      buttons,
    });
  },
});
