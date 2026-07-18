import type { WASocket } from "baileys";
import { ensureGroup, ensureGroupMember, removeGroupMember } from "@/infra/database";
import { invalidateGroupMetadata } from "@/infra/group-metadata-cache";
import { getNumber } from "@/utils/helper";

const DEFAULT_WELCOME_MESSAGE = "👋 Welcome @user! Hope you enjoy this group.";
const DEFAULT_GOODBYE_MESSAGE = "👋 Goodbye @user, see you later.";

function renderParticipantMessage(
  template: string,
  fallback: string,
  tags: string,
  groupName: string,
): string {
  const text = template.trim() || fallback;

  return text
    .replace(/@user\b/g, tags)
    .replace(/\{users?\}/g, tags)
    .replace(/\{group\}/g, groupName || "this group");
}

export async function handleGroupParticipants(
  sock: WASocket,
  { id, participants, action }: { id: string; participants: string[]; action: string },
) {
  if (action !== "add" && action !== "remove") return;

  invalidateGroupMetadata(id);
  const group = ensureGroup(id);

  for (const p of participants) {
    const jid = `${getNumber(p)}@s.whatsapp.net`;
    if (action === "add") {
      ensureGroupMember(id, jid);
    } else {
      removeGroupMember(id, jid);
    }
  }

  const mentions = participants;
  const tags = mentions.map((m) => `@${getNumber(m)}`).join(", ");
  const groupName = group.name || "this group";

  // Welcome
  if (action === "add" && group.welcome) {
    await sock.sendMessage(id, {
      text: renderParticipantMessage(group.welcomeMsg, DEFAULT_WELCOME_MESSAGE, tags, groupName),
      mentions,
    });
  }

  // Goodbye
  if (action === "remove" && group.goodbye) {
    await sock.sendMessage(id, {
      text: renderParticipantMessage(group.goodbyeMsg, DEFAULT_GOODBYE_MESSAGE, tags, groupName),
      mentions,
    });
  }
}
