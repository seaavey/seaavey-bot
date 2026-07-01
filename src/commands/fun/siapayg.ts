import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { getNumber, getRandomItem } from "@/utils/helper";
export default defineCommand({
  name: "Siapa YG",
  alias: ["spy", "siapayg"],
  description: t("fun.siapayg.description"),
  groupOnly: true,
  handler: async (sock, msg) => {
    const question = msg.args.join(" ");
    if (!question) return msg.reply(t("fun.siapayg.format"));
    const metadata = await sock.groupMetadata(msg.jid);
    const members = metadata.participants.map((p) => p.id);
    const chosen = getRandomItem(members) as string;
    await msg.send({
      text: t("fun.siapayg.result", { question, chosen: getNumber(chosen) }),
      mentions: [chosen],
    });
  },
});
