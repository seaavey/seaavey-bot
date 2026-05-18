import type { WASocket } from "baileys";
import db, { getGroup, updateMemberChat } from "@/infra/database";
import { getNumber } from "@/utils/helper";
import { logger } from "@/core/logger";
export async function handleGroupParticipants(
  sock: WASocket,
  { id, participants, action }: { id: string; participants: string[]; action: string },
) {
  if (action !== "add" && action !== "remove") return;

  const group = getGroup(id);

  for (const p of participants) {
    const jid = `${getNumber(p)}@s.whatsapp.net`;
    if (action === "add") {
      updateMemberChat(id, jid);
    } else {
      db.run("DELETE FROM group_members WHERE groupJid = ? AND memberJid = ?", [id, jid]);
    }
  }

  const mentions = participants;
  const tags = mentions.map((m) => `@${getNumber(m)}`).join(", ");

  // Welcome
  if (action === "add" && group.welcome) {
    try {
      const { generateWelcomeImage } = await import("@canvas/welcomeImage");
      const metadata = await sock.groupMetadata(id);
      for (const m of mentions) {
        let ppUrl: string | null = null;
        try {
          ppUrl = (await sock.profilePictureUrl(m, "image")) ?? null;
        } catch {}
        const imageBuffer = await generateWelcomeImage(ppUrl, getNumber(m), metadata.subject);
        await sock.sendMessage(id, {
          image: imageBuffer,
          caption: `👋 Welcome @${getNumber(m)}! Semoga betah di group ini.`,
          mentions: [m],
        });
      }
    } catch (e) {
      logger.error(e);
      await sock.sendMessage(id, {
        text: `👋 Welcome ${tags}! Semoga betah di group ini.`,
        mentions,
      });
    }
  }

  // Goodbye
  if (action === "remove" && group.goodbye) {
    try {
      const { generateGoodbyeImage } = await import("@canvas/welcomeImage");
      const metadata = await sock.groupMetadata(id);
      for (const m of mentions) {
        let ppUrl: string | null = null;
        try {
          ppUrl = (await sock.profilePictureUrl(m, "image")) ?? null;
        } catch {}
        const imageBuffer = await generateGoodbyeImage(ppUrl, getNumber(m), metadata.subject);
        await sock.sendMessage(id, {
          image: imageBuffer,
          caption: `👋 Goodbye @${getNumber(m)}, sampai jumpa lagi.`,
          mentions: [m],
        });
      }
    } catch (e) {
      logger.error(e);
      await sock.sendMessage(id, {
        text: `👋 Goodbye ${tags}, sampai jumpa lagi.`,
        mentions,
      });
    }
  }
}
