import { defineCommand } from "@/core/types";
import { addAutoReply, getAutoReplies, removeAutoReply } from "@/infra/database";

export default defineCommand({
  name: "Auto Reply",
  alias: ["ar", "autoreply"],
  description: "Manage group auto-reply. Sub: add, del, list",
  groupOnly: true,
  adminOnly: true,
  handler: async (_sock, msg) => {
    const sub = msg.args[0]?.toLowerCase();

    if (sub === "add") {
      const parts = msg.args.slice(1).join(" ").split("|");
      if (parts.length < 2)
        return msg.reply(
          "Format: .autoreply add trigger | response\nExample: .autoreply add hello | Hi there! 👋",
        );
      const trigger = parts[0]?.trim() ?? "";
      const response = parts.slice(1).join("|").trim();
      if (!trigger || !response) return msg.reply("🚩 Trigger and response cannot be empty.");
      addAutoReply(msg.jid, trigger, response, msg.sender);
      await msg.reply(`✅ Auto-reply added!
Trigger: "${trigger}"
Response: "${response}"`);
    } else if (sub === "del") {
      const trigger = msg.args.slice(1).join(" ").trim();
      if (!trigger) return msg.reply("Format: .autoreply del <trigger>");
      const removed = removeAutoReply(msg.jid, trigger);
      await msg.reply(removed ? `✅ Auto-reply "${trigger}" deleted.` : "🚩 Trigger not found.");
    } else if (sub === "list") {
      const replies = getAutoReplies(msg.jid);
      if (!replies.length) return msg.reply("📭 No auto-replies in this group yet.");
      const list = replies.map((r, i) => `${i + 1}. "${r.trigger}" → "${r.response}"`).join("\n");
      await msg.reply(`📋 *Auto-Reply List*

${list}`);
    } else {
      await msg.reply(
        "📖 *Auto-Reply Commands*\n\n.autoreply add <trigger> | <response>\n.autoreply del <trigger>\n.autoreply list",
      );
    }
  },
});
