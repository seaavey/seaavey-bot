import { config } from "@/core/config";
import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Menfess",
  alias: ["menfess"],
  description: t("fun.menfess.description"),
  privateOnly: true,
  handler: async (sock, msg) => {
    const target = msg.args[0];
    const message = msg.args.slice(1).join(" ");

    if (!target || !message) return msg.reply(t("fun.menfess.format"));

    const targetJid = `${target.replace(/[^0-9]/g, "")}@s.whatsapp.net`;

    const result = await sock.onWhatsApp(target.replace(/[^0-9]/g, ""));
    if (!result?.[0]?.exists) return msg.reply(t("fun.menfess.notRegistered"));

    await sock.sendMessage(targetJid, {
      text: t("fun.menfess.message", { message, botName: config.name, prefix: config.prefix[0] }),
    });

    await msg.reply(t("fun.menfess.sent"));
  },
});
