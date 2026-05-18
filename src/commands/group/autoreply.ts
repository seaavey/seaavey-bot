import { addAutoReply, getAutoReplies, removeAutoReply } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "autoreply",
  description: "Kelola auto-reply grup. Sub: add, del, list",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya bisa digunakan di group.");
    if (!msg.isAdmin) return msg.reply("❌ Hanya admin yang bisa menggunakan command ini.");

    const sub = msg.args[0]?.toLowerCase();

    if (sub === "add") {
      const parts = msg.args.slice(1).join(" ").split("|");
      if (parts.length < 2)
        return msg.reply(
          "Format: .autoreply add trigger | response\nContoh: .autoreply add halo | Hai juga! 👋",
        );
      const trigger = parts[0]?.trim() ?? "";
      const response = parts.slice(1).join("|").trim();
      if (!trigger || !response) return msg.reply("❌ Trigger dan response tidak boleh kosong.");
      addAutoReply(msg.jid, trigger, response, msg.sender);
      await msg.reply(`✅ Auto-reply ditambahkan!\nTrigger: "${trigger}"\nResponse: "${response}"`);
    } else if (sub === "del") {
      const trigger = msg.args.slice(1).join(" ").trim();
      if (!trigger) return msg.reply("Format: .autoreply del <trigger>");
      const removed = removeAutoReply(msg.jid, trigger);
      await msg.reply(
        removed ? `✅ Auto-reply "${trigger}" dihapus.` : "❌ Trigger tidak ditemukan.",
      );
    } else if (sub === "list") {
      const replies = getAutoReplies(msg.jid);
      if (!replies.length) return msg.reply("📭 Belum ada auto-reply di grup ini.");
      const list = replies.map((r, i) => `${i + 1}. "${r.trigger}" → "${r.response}"`).join("\n");
      await msg.reply(`📋 *Auto-Reply List*\n\n${list}`);
    } else {
      await msg.reply(
        "📖 *Auto-Reply Commands*\n\n" +
          ".autoreply add <trigger> | <response>\n" +
          ".autoreply del <trigger>\n" +
          ".autoreply list",
      );
    }
  },
});
