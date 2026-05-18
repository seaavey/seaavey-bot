import { getUser } from "@/infra/database";
import { getNumber } from "@/utils/helper";
import { logger } from "@/core/logger";
import { defineCommand } from "@/core/types";
export default defineCommand({
  name: "level",
  description: "Cek level dan XP kamu",
  handler: async (sock, msg) => {
    const user = getUser(msg.sender);
    const level = user?.level ?? 1;
    const xp = user?.xp ?? 0;
    const nextLevel = level * 100;

    try {
      const { generateRankCard } = await import("@canvas/rankCard");
      let ppUrl: string | null = null;
      try {
        ppUrl = (await sock.profilePictureUrl(msg.sender, "image")) ?? null;
      } catch {}

      const userName = msg.msg.pushName || getNumber(msg.sender);
      const imageBuffer = await generateRankCard(ppUrl, userName, level, xp, nextLevel);

      await sock.sendMessage(
        msg.jid,
        {
          image: imageBuffer,
          caption: `🎮 *Level ${level}* (${xp}/${nextLevel} XP)`,
        },
        { quoted: msg.msg },
      );
    } catch (e) {
      logger.error(e);
      // Fallback text
      const bar =
        "█".repeat(Math.floor((xp / nextLevel) * 10)) +
        "░".repeat(10 - Math.floor((xp / nextLevel) * 10));
      await msg.reply(`🎮 *Level ${level}*\n\n${bar} (${xp}/${nextLevel} XP)`);
    }
  },
});
