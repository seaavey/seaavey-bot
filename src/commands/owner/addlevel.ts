import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { addLevel } from "@/infra/database";
import { getNumber } from "@/utils/helper";

export default defineCommand({
  name: "AddLevel",
  alias: ["addlevel"],
  description: t("owner.addlevel.desc"),
  ownerOnly: true,
  handler: async (_sock, msg) => {
    const target = msg.quoted?.sender || msg.mentioned[0];
    const amount = Number.parseInt(msg.args[1] || msg.args[0] || "0", 10);

    if (!target || Number.isNaN(amount)) {
      return msg.reply(t("owner.addlevel.format"));
    }

    addLevel(target, amount);
    await msg.reply(
      t("owner.addlevel.success", { amount: String(amount), target: getNumber(target) }),
    );
  },
});
