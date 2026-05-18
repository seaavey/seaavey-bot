import db from "@/infra/database";
import { defineCommand } from "@/core/types";

db.run(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerJid TEXT,
    task TEXT,
    done INTEGER DEFAULT 0,
    timestamp INTEGER DEFAULT 0
  )
`);

export default defineCommand({
  name: "todo",
  description: "Personal todo list. .todo add/list/done/del",
  handler: async (_sock, msg) => {
    const sub = msg.args[0]?.toLowerCase();

    if (sub === "add") {
      const task = msg.args.slice(1).join(" ");
      if (!task) return msg.reply("Format: .todo add <task>");
      db.run("INSERT INTO todos (ownerJid, task, timestamp) VALUES (?, ?, ?)", [
        msg.sender,
        task,
        Date.now(),
      ]);
      return msg.reply(`✅ Task ditambahkan: ${task}`);
    }

    if (sub === "list") {
      const todos = db
        .query(
          "SELECT id, task, done FROM todos WHERE ownerJid = ? AND done = 0 ORDER BY timestamp",
        )
        .all(msg.sender) as { id: number; task: string; done: number }[];
      if (!todos.length) return msg.reply("📋 Todo list kosong!");
      const list = todos.map((t, i) => `${i + 1}. ${t.task}`).join("\n");
      return msg.reply(`📋 *Todo List*\n\n${list}\n\nSelesai: .todo done <nomor>`);
    }

    if (sub === "done") {
      const idx = parseInt(msg.args[1] || "0", 10);
      const todos = db
        .query("SELECT id FROM todos WHERE ownerJid = ? AND done = 0 ORDER BY timestamp")
        .all(msg.sender) as { id: number }[];
      const target = todos[idx - 1];
      if (!target) return msg.reply("❌ Nomor tidak valid.");
      db.run("UPDATE todos SET done = 1 WHERE id = ?", [target.id]);
      return msg.reply("✅ Task selesai!");
    }

    if (sub === "clear") {
      db.run("DELETE FROM todos WHERE ownerJid = ? AND done = 1", [msg.sender]);
      return msg.reply("🗑️ Completed tasks dihapus.");
    }

    await msg.reply("Format:\n.todo add <task>\n.todo list\n.todo done <nomor>\n.todo clear");
  },
});
