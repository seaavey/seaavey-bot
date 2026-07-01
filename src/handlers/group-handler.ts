import type { WASocket } from "baileys";
import db, { getGroup, updateMemberChat } from "@/infra/database";
import { invalidateGroupMetadata } from "@/infra/group-metadata-cache";
import { getNumber } from "@/utils/helper";

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
    await sock.sendMessage(id, {
      text: `👋 Welcome ${tags}! Hope you enjoy this group.`,
      mentions,
    });
  }

  // Goodbye
  if (action === "remove" && group.goodbye) {
    await sock.sendMessage(id, {
      text: `👋 Goodbye ${tags}, see you later.`,
      mentions,
    });
  }
}
