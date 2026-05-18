import db from "@/infra/database";
import { defineCommand } from "@/core/types";

db.run(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerJid TEXT,
    title TEXT,
    content TEXT,
    timestamp INTEGER DEFAULT 0
  )
`);

export default defineCommand({
  name: "note",
  description:
    "Simpan/ambil catatan. .note save <judul> <isi> / .note get <judul> / .note list / .note del <judul>",
  handler: async (_sock, msg) => {
    const sub = msg.args[0]?.toLowerCase();

    if (sub === "save") {
      const title = msg.args[1];
      const content = msg.args.slice(2).join(" ");
      if (!title || !content) return msg.reply("Format: .note save <judul> <isi>");
      db.run("INSERT INTO notes (ownerJid, title, content, timestamp) VALUES (?, ?, ?, ?)", [
        msg.sender,
        title,
        content,
        Date.now(),
      ]);
      return msg.reply(`📝 Note *${title}* tersimpan!`);
    }

    if (sub === "get") {
      const title = msg.args[1];
      if (!title) return msg.reply("Format: .note get <judul>");
      const note = db
        .query("SELECT content FROM notes WHERE ownerJid = ? AND title = ?")
        .get(msg.sender, title) as { content: string } | null;
      if (!note) return msg.reply("❌ Note tidak ditemukan.");
      return msg.reply(`📝 *${title}*\n\n${note.content}`);
    }

    if (sub === "list") {
      const notes = db
        .query("SELECT title FROM notes WHERE ownerJid = ? ORDER BY timestamp DESC")
        .all(msg.sender) as { title: string }[];
      if (!notes.length) return msg.reply("📝 Belum ada note.");
      const list = notes.map((n, i) => `${i + 1}. ${n.title}`).join("\n");
      return msg.reply(`📝 *Notes Kamu*\n\n${list}`);
    }

    if (sub === "del") {
      const title = msg.args[1];
      if (!title) return msg.reply("Format: .note del <judul>");
      db.run("DELETE FROM notes WHERE ownerJid = ? AND title = ?", [msg.sender, title]);
      return msg.reply(`🗑️ Note *${title}* dihapus.`);
    }

    await msg.reply(
      "Format:\n.note save <judul> <isi>\n.note get <judul>\n.note list\n.note del <judul>",
    );
  },
});
