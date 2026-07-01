import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { GameManager } from "@/game/game-helper";
import type { WordGameConfig } from "@/game/types";
import { getRandomItem, loadGameData } from "@/utils/helper";

export function createWordGame<T>(config: WordGameConfig<T>) {
  const gm = new GameManager(config.reward);
  const localData = loadGameData<T>(config.dataFile);

  const command = defineCommand({
    name: config.name,
    triggers: config.triggers,
    alias: config.triggers.slice(1),
    description: config.description,
    handler: async (sock, msg) => {
      if (msg.args[0] === "hint") {
        const hint = gm.getHint(msg.jid);
        return msg.reply(
          hint ? t("game.factory.hint", { hint }) : t("game.factory.noActiveSession"),
        );
      }

      if (!localData.length) return msg.reply(t("game.factory.emptyData"));
      const item = getRandomItem(localData);
      const answer = config.answer(item);
      const timeoutMs = config.timeoutMs ?? 60000;

      const success = gm.start(msg.jid, answer, msg.sender, () => {
        const timeoutMsg = config.timeoutMessage
          ? config.timeoutMessage(item, answer)
          : t("game.factory.timeout", { answer });
        sock.sendMessage(msg.jid, { text: timeoutMsg });
      });

      if (!success) return msg.reply(t("game.factory.finishPrevious"));

      const questionText = config.question(item);
      const imageUrl = config.image?.(item);

      if (imageUrl) {
        await msg.send({
          image: { url: imageUrl },
          caption: t("game.factory.questionWithImage", {
            emoji: config.emoji,
            name: config.name,
            question: questionText,
            time: String(timeoutMs / 1000),
          }),
        });
      } else {
        await msg.reply(
          t("game.factory.captionNoImage", {
            emoji: config.emoji,
            name: config.name,
            question: questionText,
            timeout: timeoutMs / 1000,
            trigger: config.triggers[0],
          }),
        );
      }
    },
  });

  function checkAnswer(jid: string, text: string, sender: string): string | null {
    const ans = gm.check(jid, text.trim(), sender);
    if (!ans) return null;
    const item = localData.find((d) => config.answer(d).toLowerCase() === ans);
    if (config.correctMessage && item) {
      return config.correctMessage(item, ans);
    }
    return t("game.factory.correctDefault", { answer: ans.toUpperCase(), xp: config.reward });
  }

  return { command, checkAnswer };
}
