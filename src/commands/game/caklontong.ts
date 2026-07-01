import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { GameManager } from "@/game/game-helper";
import { getRandomItem, loadGameData } from "@/utils/helper";

const gm = new GameManager(30);

const localData = loadGameData<{ soal: string; jawaban: string; deskripsi: string }>(
  "caklontong.json",
);

export default defineCommand({
  name: "Cak Lontong",
  alias: ["cl", "caklontong"],
  description: t("game.caklontong.desc"),
  handler: async (sock, msg) => {
    if (msg.args[0] === "hint") {
      const hint = gm.getHint(msg.jid);
      return msg.reply(hint ? t("game.caklontong.hint", { hint }) : t("game.caklontong.noSession"));
    }

    const item = getRandomItem(localData);
    const success = gm.start(msg.jid, item.jawaban, msg.sender, () => {
      sock.sendMessage(msg.jid, {
        text: t("game.caklontong.timeout", { answer: item.jawaban, description: item.deskripsi }),
      });
    });

    if (!success) return msg.reply(t("game.caklontong.finishPrevious"));
    await msg.reply(t("game.caklontong.start", { question: item.soal }));
  },
});

export const checkCakLontong = (jid: string, text: string, sender: string) => {
  const ans = gm.check(jid, text, sender);
  return ans ? t("game.caklontong.correct") : null;
};
