import { defineCommand } from "@/core/types";
import { t } from "@/core/translations";
import db from "@/infra/database";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "Leaderboard",
  alias: ["lb", "top", "leaderboard"],
  description: t("group.leaderboard.description"),
  groupOnly: true,
  handler: async (_sock, msg) => {
    const top = db
      .query(
        "SELECT memberJid, chatCount FROM group_members WHERE groupJid = ? ORDER BY chatCount DESC LIMIT 10",
      )
      .all(msg.jid) as { memberJid: string; chatCount: number }[];

    if (!top.length) return msg.reply(t("group.leaderboard.noData"));

    const medals = ["🥇", "🥈", "🥉"];
    const list = top
      .map(
        (m, i) =>
          `${medals[i] || `${i + 1}.`} @${getNumber(m.memberJid)} — ${m.chatCount} ${t("group.leaderboard.messages")}`,
      )
      .join("\n");

    await msg.send({
      text: t("group.leaderboard.title", { list }),
      mentions: top.map((m) => m.memberJid),
    });
  },
});
