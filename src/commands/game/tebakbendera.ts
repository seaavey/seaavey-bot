import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { GameManager } from "@/game/game-helper";
import { getRandomItem, loadGameData } from "@/utils/helper";

const gm = new GameManager(50);

const localData = loadGameData<{ flag: string; img: string; name: string }>("tebakbendera.json");

export default defineCommand({
  name: "Tebak Bendera",
  alias: ["tbb", "bendera", "tebakbendera"],
  description: t("game.tebakbendera.desc"),
  handler: async (sock, msg) => {
    if (msg.args[0] === "hint") {
      const hint = gm.getHint(msg.jid);
      return msg.reply(
        hint ? t("game.tebakbendera.hint", { hint }) : t("game.tebakbendera.noSession"),
      );
    }

    const item = getRandomItem(localData);
    const success = gm.start(msg.jid, item.name, msg.sender, () => {
      sock.sendMessage(msg.jid, { text: t("game.tebakbendera.timeout", { answer: item.name }) });
    });

    if (!success) return msg.reply(t("game.tebakbendera.finishPrevious"));
    await msg.send({
      image: { url: item.img },
      caption: t("game.tebakbendera.start"),
    });
  },
});

export const checkTebakBendera = (jid: string, text: string, sender: string) => {
  const ans = gm.check(jid, text, sender);
  return ans ? t("game.tebakbendera.correct", { answer: ans }) : null;
};
