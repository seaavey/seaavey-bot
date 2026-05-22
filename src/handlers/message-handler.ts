import { writeFile } from "node:fs/promises";
import { proto, type WAMessage, type WASocket } from "baileys";
import { config, isDev } from "@/core/config";
import { logger } from "@/core/logger";
import type { MessageContext } from "@/handlers/message-context";
import db from "@/infra/db/client";
import { commands } from "@/infra/loader";
import { getGroup, updateMemberChat } from "@/infra/repositories/group-repo";
import { addHit, getUser, isBanned } from "@/infra/repositories/user-repo";
import { runMiddlewares } from "@/middleware";
import { getNumber, parseMessage } from "@/utils/helper";
import { TtlMap } from "@/utils/ttl-map";

const messageStore = new TtlMap<string, WAMessage>(10 * 60 * 1000);

export function getStoredMessage(id: string) {
  return messageStore.get(id);
}

export async function handleMessagesUpsert(sock: WASocket, messages: WAMessage[]) {
  for (const msg of messages) {
    if (msg.key.fromMe) continue;

    if (msg.key.id) messageStore.set(msg.key.id, msg);
    if (isDev) writeFile("message.txt", JSON.stringify(msg, null, 2));

    const parse = await parseMessage(sock, msg);

    if (parse.isGroup) {
      updateMemberChat(parse.jid, parse.sender);
      const group = getGroup(parse.jid);

      const count = db
        .query("SELECT COUNT(*) as c FROM group_members WHERE groupJid = ?")
        .get(parse.jid) as { c: number };
      if (count.c <= 1) {
        const metadata = await sock.groupMetadata(parse.jid);
        for (const p of metadata.participants) {
          updateMemberChat(parse.jid, p.phoneNumber || p.id);
        }
      }

      const ctx: MessageContext = { sock, raw: msg, parse, group };
      const result = await runMiddlewares(ctx);
      if (result === "stop") continue;
    } else {
      const ctx: MessageContext = { sock, raw: msg, parse };
      const result = await runMiddlewares(ctx);
      if (result === "stop") continue;
    }

    let cmdName: string | undefined;
    if (parse.body.startsWith("=> ") || parse.body === "=>") cmdName = "=>";
    else if (parse.body.startsWith("> ") || parse.body === ">") cmdName = ">";
    else if (parse.body.startsWith(config.prefix))
      [cmdName] = parse.body.slice(config.prefix.length).split(" ");

    if (!cmdName) continue;
    if (isBanned(parse.sender)) continue;
    if (parse.isGroup && getGroup(parse.jid).mute && !parse.isAdmin) continue;

    const cmd = commands.get(cmdName.toLowerCase());
    if (cmd) {
      addHit(parse.sender);
      const user = getUser(parse.sender);
      const prevLevel = user?.level ?? 0;
      await cmd.handler(sock, parse).catch((e) => logger.error(e));
      const after = getUser(parse.sender);
      if (after && after.level > prevLevel) {
        await sock.sendMessage(parse.jid, {
          text: `🎉 *Level Up!*\n\n@${getNumber(parse.sender)} naik ke level *${after.level}*! 🏆`,
          mentions: [parse.sender],
        });
      }
    }
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
