import type { WASocket } from "baileys";
import { logger } from "@/core/logger";
import {
  getCachedGroupMetadata,
  invalidateGroupMetadata,
} from "@/infra/cache/group-metadata-cache";
import db, { getGroup, updateMemberChat } from "@/infra/database";
import { getNumber, getProfilePictureUrl } from "@/utils/helper";

export async function handleGroupParticipants(
  sock: WASocket,
  { id, participants, action }: { id: string; participants: string[]; action: string },
) {
  if (action !== "add" && action !== "remove") return;

  invalidateGroupMetadata(id);
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
      const { generateWelcomeImage } = await import("@/canvas/welcomeImage");
      const metadata = await getCachedGroupMetadata(sock, id);
      for (const m of mentions) {
        const ppUrl = await getProfilePictureUrl(sock, m);
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
      const { generateGoodbyeImage } = await import("@/canvas/welcomeImage");
      const metadata = await getCachedGroupMetadata(sock, id);
      for (const m of mentions) {
        const ppUrl = await getProfilePictureUrl(sock, m);
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
