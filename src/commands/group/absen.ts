import { defineCommand } from "@/core/types";
import { t } from "@/core/translations";
import { getNumber } from "@/utils/helper";

const sessions = new Map<string, { title: string; members: Set<string>; creator: string }>();

export default defineCommand({
  name: "Absen",
  alias: ["absen"],
  description: t("group.absen.description"),
  groupOnly: true,
  handler: async (_sock, msg) => {
    const sub = msg.args[0]?.toLowerCase();

    if (sub === "buka" || sub === "open") {
      if (!msg.isAdmin) return msg.reply(t("group.absen.adminOnly"));
      const title = msg.args.slice(1).join(" ") || t("group.absen.defaultTitle");
      sessions.set(msg.jid, { title, members: new Set(), creator: msg.sender });
      return msg.reply(t("group.absen.opened", { title }));
    }

    if (sub === "hadir" || sub === "h") {
      const session = sessions.get(msg.jid);
      if (!session) return msg.reply(t("group.absen.noSession"));
      session.members.add(msg.sender);
      return msg.reply(
        t("group.absen.present", { user: getNumber(msg.sender), count: session.members.size }),
      );
    }

    if (sub === "tutup" || sub === "close") {
      if (!msg.isAdmin) return msg.reply(t("group.absen.adminOnly"));
      const session = sessions.get(msg.jid);
      if (!session) return msg.reply(t("group.absen.noSession"));
      const list = [...session.members].map((m, i) => `${i + 1}. @${getNumber(m)}`).join("\n");
      sessions.delete(msg.jid);
      return msg.send({
        text: t("group.absen.closed", { title: session.title, count: session.members.size, list }),
        mentions: [...session.members],
      });
    }

    await msg.reply(t("group.absen.help"));
  },
});
