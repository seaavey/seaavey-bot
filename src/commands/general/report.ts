import { t } from "@/core/translations";
import { config } from "@/core/config";
import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";
export default defineCommand({
  name: "Report",
  alias: ["rpt", "report"],
  description: t("general.report.desc"),
  handler: async (sock, msg) => {
    const text = msg.args.join(" ");
    if (!text) return msg.reply(t("general.report.format"));
    const ownerJid = `${config.owner[0]}@s.whatsapp.net`;
    await sock.sendMessage(ownerJid, {
      text: t("general.report.toOwner", {
        sender: getNumber(msg.sender),
        text,
        location: msg.isGroup ? msg.jid : t("general.report.privateChat"),
      }),
      mentions: [msg.sender],
    });
    await msg.reply(t("general.report.sent"));
  },
});
