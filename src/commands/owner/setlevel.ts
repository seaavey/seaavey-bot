import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { setLevel } from "@/infra/database";
import { getNumber } from "@/utils/helper";

export default defineCommand({
  name: "SetLevel",
  alias: ["setlevel"],
  description: t("owner.setlevel.desc"),
  ownerOnly: true,
  handler: async (_sock, msg) => {
    const target = msg.quoted?.sender || msg.mentioned[0];
    const level = Number.parseInt(msg.args[1] || msg.args[0] || "0", 10);

    if (!target || Number.isNaN(level)) {
      return msg.reply(t("owner.setlevel.format"));
    }

    setLevel(target, level);
    await msg.reply(
      t("owner.setlevel.success", { target: getNumber(target), level: String(level) }),
    );
  },
});
