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
        return msg.reply(hint ? `💡 Hint: *${hint}*` : "🚩 No active session!");
      }

      if (!localData.length) return msg.reply("🚩 No data.");
      const item = getRandomItem(localData);
      const answer = config.answer(item);
      const timeoutMs = config.timeoutMs ?? 60000;

      const success = gm.start(msg.jid, answer, msg.sender, () => {
        const timeoutMsg = config.timeoutMessage
          ? config.timeoutMessage(item, answer)
          : `⏰ Time's up! The answer: *${answer}*`;
        sock.sendMessage(msg.jid, { text: timeoutMsg });
      });

      if (!success) return msg.reply("⏳ Finish the previous question first!");

      const questionText = config.question(item);
      const imageUrl = config.image?.(item);

      if (imageUrl) {
        await msg.send({
          image: { url: imageUrl },
          caption: `${config.emoji} *${config.name}*

${questionText}

Time ${String(timeoutMs / 1000)}s!`,
        });
      } else {
        await msg.reply(
          `${config.emoji} *${config.name}*

${questionText}

Time ${timeoutMs / 1000}s!
(Type *.${config.triggers[0]} hint*)`,
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
    return `✅ Correct! The answer is *${ans.toUpperCase()}* (+${config.reward} XP)`;
  }

  return { command, checkAnswer };
}
