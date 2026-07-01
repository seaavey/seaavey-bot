import { defineCommand } from "@/core/types";
import { t } from "@/core/translations";
import { addAutoReply, getAutoReplies, removeAutoReply } from "@/infra/database";

export default defineCommand({
  name: "Auto Reply",
  alias: ["ar", "autoreply"],
  description: t("group.autoreply.description"),
  groupOnly: true,
  adminOnly: true,
  handler: async (_sock, msg) => {
    const sub = msg.args[0]?.toLowerCase();

    if (sub === "add") {
      const parts = msg.args.slice(1).join(" ").split("|");
      if (parts.length < 2) return msg.reply(t("group.autoreply.addUsage"));
      const trigger = parts[0]?.trim() ?? "";
      const response = parts.slice(1).join("|").trim();
      if (!trigger || !response) return msg.reply(t("group.autoreply.invalidAdd"));
      addAutoReply(msg.jid, trigger, response, msg.sender);
      await msg.reply(t("group.autoreply.added", { trigger, response }));
    } else if (sub === "del") {
      const trigger = msg.args.slice(1).join(" ").trim();
      if (!trigger) return msg.reply(t("group.autoreply.delUsage"));
      const removed = removeAutoReply(msg.jid, trigger);
      await msg.reply(
        removed ? t("group.autoreply.deleted", { trigger }) : t("group.autoreply.notFound"),
      );
    } else if (sub === "list") {
      const replies = getAutoReplies(msg.jid);
      if (!replies.length) return msg.reply(t("group.autoreply.noReplies"));
      const list = replies.map((r, i) => `${i + 1}. "${r.trigger}" → "${r.response}"`).join("\n");
      await msg.reply(t("group.autoreply.list", { list }));
    } else {
      await msg.reply(t("group.autoreply.help"));
    }
  },
});
