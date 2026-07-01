import { defineCommand } from "@/core/types";
import { t } from "@/core/translations";
import { getGroup, getWarns } from "@/infra/database";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "Warn List",
  alias: ["wl", "warns", "warnlist"],
  description: t("group.warnlist.description"),
  groupOnly: true,
  handler: async (_sock, msg) => {
    const target = msg.mentioned[0] || msg.quoted?.sender || msg.sender;
    const warns = getWarns(msg.jid, target);
    const max = getGroup(msg.jid).warnMax || 3;
    if (!warns.length) return msg.reply(t("group.warnlist.clean", { target: getNumber(target) }));
    const list = warns
      .map((w, i) => `${i + 1}. ${w.reason} (${new Date(w.timestamp).toLocaleDateString("id")})`)
      .join("\n");
    await msg.reply(
      t("group.warnlist.list", { target: getNumber(target), count: warns.length, max, list }),
    );
  },
});
