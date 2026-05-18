import db, { getUser } from "@/infra/database";
import { getNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";
export default defineCommand({
  name: "profile",
  description: "Lihat profile card / rank kamu",
  handler: async (_sock, msg) => {
    const target = msg.mentioned[0] || msg.sender;
    const user = getUser(target);
    const level = user?.level ?? 1;
    const xp = user?.xp ?? 0;
    const hits = user?.hits ?? 0;
    const nextLevel = level * 100;
    const progress = Math.floor((xp / nextLevel) * 100);
    const bar = "█".repeat(Math.floor(progress / 10)) + "░".repeat(10 - Math.floor(progress / 10));

    // Get rank
    const allUsers = db.query("SELECT jid FROM users ORDER BY level DESC, xp DESC").all() as {
      jid: string;
    }[];
    const rank = allUsers.findIndex((u) => u.jid === target) + 1 || allUsers.length + 1;

    // Get group stats if in group
    let groupStats = "";
    if (msg.isGroup) {
      const member = db
        .query("SELECT chatCount FROM group_members WHERE groupJid = ? AND memberJid = ?")
        .get(msg.jid, target) as { chatCount: number } | null;
      if (member) groupStats = `\n💬 Chat di grup: ${member.chatCount} pesan`;
    }

    const name = getNumber(target);
    const card =
      `╭─── *Profile Card* ───╮\n` +
      `│ 👤 @${name}\n` +
      `│ 🏅 Rank: #${rank}\n` +
      `│ ⭐ Level: ${level}\n` +
      `│ ✨ XP: ${xp}/${nextLevel} (${progress}%)\n` +
      `│ ${bar}\n` +
      `│ 📊 Total hits: ${hits}${groupStats}\n` +
      `╰────────────────╯`;

    await msg.send({ text: card, mentions: [target] });
  },
});
