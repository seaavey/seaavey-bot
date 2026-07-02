import { defineCommand } from "@/core/types";
import db from "@/infra/database";

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
  name: "Todo",
  alias: ["todo"],
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
      return msg.reply("✅ Task added!");
    }

    if (sub === "list") {
      const todos = db
        .query(
          "SELECT id, task, done FROM todos WHERE ownerJid = ? AND done = 0 ORDER BY timestamp",
        )
        .all(msg.sender) as { id: number; task: string; done: number }[];
      if (!todos.length) return msg.reply("📝 No tasks in your todo list.");
      const list = todos.map((t, i) => `${i + 1}. ${t.task}`).join("\n");
      return msg.reply(`📋 *Todo List*

${list}

Done: .todo done <number>`);
    }

    if (sub === "done") {
      const idx = parseInt(msg.args[1] || "0", 10);
      const todos = db
        .query("SELECT id FROM todos WHERE ownerJid = ? AND done = 0 ORDER BY timestamp")
        .all(msg.sender) as { id: number }[];
      const target = todos[idx - 1];
      if (!target) return msg.reply("🚩 Invalid number.");
      db.run("UPDATE todos SET done = 1 WHERE id = ?", [target.id]);
      return msg.reply("✅ Task completed!");
    }

    if (sub === "clear") {
      db.run("DELETE FROM todos WHERE ownerJid = ? AND done = 1", [msg.sender]);
      return msg.reply("✅ Cleared all completed tasks!");
    }

    await msg.reply("Format: .todo add <task> / .todo list / .todo done <number> / .todo clear");
  },
});
