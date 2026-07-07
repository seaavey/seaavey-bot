import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { proto, type WAMessage, type WASocket, isJidNewsletter, isJidBroadcast } from "baileys";

import { isDev } from "@/core/config";
import { dispatchCommand } from "@/handlers/command-dispatcher";
import type { MessageContext } from "@/handlers/message-context";
import { getCachedGroupMetadata } from "@/infra/group-metadata-cache";
import {
  countGroupMembers,
  ensureGroupMember,
  getGroup,
  recordMemberChat,
} from "@/infra/repositories/group-repo";
import { runMiddlewares } from "@/handlers/middleware";
import { getNumber } from "@/utils/helper";
import { resolveMessage } from "@/utils/message-resolver";
import { TtlMap } from "@/utils/ttl-map";

const messageStore = new TtlMap<string, WAMessage>(10 * 60 * 1000);

if (isDev) {
  mkdir("dev", { recursive: true }).catch(() => {});
}

export async function handleMessagesUpsert(sock: WASocket, messages: WAMessage[]) {
  for (const msg of messages) {
    if (!isDev && msg.key.fromMe) continue;

    const jid = msg.key.remoteJid || "";
    // Ignore messages from channels/newsletters and status broadcasts to prevent the bot from processing them
    if (isJidNewsletter(jid) || isJidBroadcast(jid)) continue;

    if (msg.key.id) messageStore.set(msg.key.id, msg);

    const parse = await resolveMessage(sock, msg);

    if (isDev) {
      writeFile("dev/parsed-message.json", JSON.stringify(parse, null, 2)).catch(() => {});
      appendFile(
        "dev/history-message.txt",
        `${JSON.stringify(msg, null, 2)}\n\n${"─".repeat(50)}\n\n`,
      ).catch(() => {});
    }

    if (parse.isGroup) {
      recordMemberChat(parse.jid, parse.sender);
      const group = getGroup(parse.jid);

      if (countGroupMembers(parse.jid) <= 1) {
        const metadata = await getCachedGroupMetadata(sock, parse.jid);
        for (const p of metadata.participants) {
          ensureGroupMember(parse.jid, p.phoneNumber || p.id);
        }
      }

      const ctx: MessageContext = { sock, parse, group };
      const result = await runMiddlewares(ctx);
      if (result === "stop") continue;
    } else {
      const ctx: MessageContext = { sock, parse };
      const result = await runMiddlewares(ctx);
      if (result === "stop") continue;
    }

    await dispatchCommand(sock, parse);
  }
}

export async function handleMessagesUpdate(
  sock: WASocket,
  updates: { key: proto.IMessageKey; update: proto.IWebMessageInfo }[],
) {
  for (const { key, update } of updates) {
    if (!key.remoteJid || !key.id) continue;
    if (update.messageStubType !== proto.WebMessageInfo.StubType.REVOKE) continue;

    const jid = key.remoteJid;
    if (!jid.endsWith("@g.us")) continue;

    const group = getGroup(jid);
    if (!group.antidelete) continue;

    const stored = messageStore.get(key.id);
    if (!stored?.message || !stored.key) continue;

    const sender = stored.key.participant || stored.key.remoteJid || "";
    const body =
      stored.message.conversation ||
      stored.message.extendedTextMessage?.text ||
      stored.message.imageMessage?.caption ||
      stored.message.videoMessage?.caption ||
      "";

    const text = `🚫 *Anti-Delete Detected*\n\n👤 @${getNumber(sender)}\n💬 ${body || "[media]"}`;
    await sock.sendMessage(jid, { text, mentions: [sender] });

    if (
      stored.message.imageMessage ||
      stored.message.videoMessage ||
      stored.message.documentMessage ||
      stored.message.audioMessage ||
      stored.message.stickerMessage
    ) {
      await sock.sendMessage(jid, { forward: stored });
    }
  }
}
