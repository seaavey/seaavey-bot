import { writeFile } from "node:fs/promises";
import { downloadMediaMessage, proto, type WAMessage, type WASocket } from "baileys";
import { config, isDev } from "@/core/config";
import db, {
  addHit,
  findAutoReply,
  getAfk,
  getGroup,
  getUser,
  isBanned,
  isToxicMessage,
  removeAfk,
  updateMemberChat,
} from "@/infra/database";
import { checkGameAnswer } from "@/game/game";
import { getNumber, parseMessage } from "@/utils/helper";
import { commands } from "@/infra/loader";
import { logger } from "@/core/logger";

const messageStore = new Map<string, WAMessage>();
const spamTracker = new Map<string, number[]>();
const MSG_TTL = 10 * 60 * 1000;

// Cleanup message store
setInterval(() => {
  const now = Date.now();
  for (const [id, msg] of messageStore) {
    const ts = (msg.messageTimestamp as number) * 1000;
    if (now - ts > MSG_TTL) messageStore.delete(id);
  }
}, 60_000);

export async function handleMessagesUpsert(sock: WASocket, messages: WAMessage[]) {
  for (const msg of messages) {
    if (msg.key.fromMe) continue;

    // Anti ViewOnce
    const viewOnce =
      msg.message?.viewOnceMessage?.message || msg.message?.viewOnceMessageV2?.message;
    if (viewOnce) {
      const ownerJid = `${config.owner[0]}@s.whatsapp.net`;
      const sender = msg.key.participant || msg.key.remoteJid || "";
      await sock.sendMessage(ownerJid, {
        text: `👁️ *View Once Detected*\n\n👤 ${sender}\n📍 ${msg.key.remoteJid}`,
      });
      await sock.sendMessage(ownerJid, { forward: { key: msg.key, message: viewOnce } });

      if (msg.key.remoteJid?.endsWith("@g.us")) {
        const grp = getGroup(msg.key.remoteJid);
        if (grp.antiviewonce) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `👁️ *View Once Opened*\n\n👤 @${getNumber(sender)} mengirim pesan view once:`,
            mentions: [sender],
          });
          await sock.sendMessage(msg.key.remoteJid, {
            forward: { key: msg.key, message: viewOnce },
          });
        }
      }
    }

    if (msg.key.id) messageStore.set(msg.key.id, msg);
    if (isDev) writeFile("message.txt", JSON.stringify(msg, null, 2));

    const parse = await parseMessage(sock, msg);

    if (parse.isGroup) {
      updateMemberChat(parse.jid, parse.sender);
      const group = getGroup(parse.jid);

      // Auto-register members
      const count = db
        .query("SELECT COUNT(*) as c FROM group_members WHERE groupJid = ?")
        .get(parse.jid) as { c: number };
      if (count.c <= 1) {
        const metadata = await sock.groupMetadata(parse.jid);
        for (const p of metadata.participants) {
          updateMemberChat(parse.jid, p.phoneNumber || p.id);
        }
      }

      // Antilink
      if (group.antilink && !parse.isAdmin && /https?:\/\/\S+/i.test(parse.body)) {
        await sock.sendMessage(parse.jid, { delete: msg.key });
        await sock.sendMessage(parse.jid, {
          text: `⚠️ @${getNumber(parse.sender)} link tidak diperbolehkan!`,
          mentions: [parse.sender],
        });
        continue;
      }

      // Antispam
      if (group.antispam && !parse.isAdmin) {
        const key = `${parse.jid}:${parse.sender}`;
        const now = Date.now();
        const timestamps = spamTracker.get(key) || [];
        timestamps.push(now);
        const recent = timestamps.filter((t) => now - t < 10_000);
        spamTracker.set(key, recent);
        if (recent.length >= 5) {
          spamTracker.delete(key);
          await sock.sendMessage(parse.jid, { delete: msg.key });
          await sock.sendMessage(parse.jid, {
            text: `⚠️ @${getNumber(parse.sender)} jangan spam!`,
            mentions: [parse.sender],
          });
          continue;
        }
      }

      // Antitoxic
      if (group.antitoxic && !parse.isAdmin) {
        const customToxic = isToxicMessage(parse.jid, parse.body);
        if (config.toxicRegex.test(parse.body) || customToxic) {
          await sock.sendMessage(parse.jid, { delete: msg.key });
          await sock.sendMessage(parse.jid, {
            text: `⚠️ @${getNumber(parse.sender)} jaga bicaramu!`,
            mentions: [parse.sender],
          });
          continue;
        }
      }

      // Anti-NSFW
      if (group.antinsfw && !parse.isAdmin && msg.message?.imageMessage) {
        try {
          const buffer = await downloadMediaMessage(msg, "buffer", {});
          const base64 = Buffer.from(buffer).toString("base64");
          const res = await fetch("https://api.seaavey.com/tools/nsfw-detect", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-API-KEY": config.apiKey },
            body: JSON.stringify({ image: base64 }),
          });
          const data = (await res.json()) as { data?: { nsfw?: boolean } };
          if (data.data?.nsfw) {
            await sock.sendMessage(parse.jid, { delete: msg.key });
            await sock.sendMessage(parse.jid, {
              text: `🚫 @${getNumber(parse.sender)} gambar NSFW terdeteksi dan dihapus!`,
              mentions: [parse.sender],
            });
            continue;
          }
        } catch (e) {
          logger.error(`NSFW Check Error: ${e}`);
        }
      }
    }

    // AFK & Game & Auto-reply
    const senderAfk = getAfk(parse.sender);
    if (senderAfk) {
      removeAfk(parse.sender);
      await sock.sendMessage(parse.jid, {
        text: `👋 @${getNumber(parse.sender)} sudah kembali! (AFK ${Math.floor((Date.now() - senderAfk.timestamp) / 60000)} menit)`,
        mentions: [parse.sender],
      });
    }

    if (parse.body && !parse.body.startsWith(config.prefix)) {
      for (const m of parse.mentioned) {
        const afk = getAfk(m);
        if (afk) {
          await sock.sendMessage(parse.jid, {
            text: `💤 @${getNumber(m)} sedang AFK\nAlasan: ${afk.reason}\nSejak: ${Math.floor((Date.now() - afk.timestamp) / 60000)} menit lalu`,
            mentions: [m],
          });
        }
      }

      const gameResult = checkGameAnswer(parse.jid, parse.body, parse.sender);
      if (gameResult) {
        await sock.sendMessage(parse.jid, { text: gameResult }, { quoted: msg });
        continue;
      }

      if (parse.isGroup) {
        const autoReply = findAutoReply(parse.jid, parse.body);
        if (autoReply)
          await sock.sendMessage(parse.jid, { text: autoReply.response }, { quoted: msg });
      }
    }

    // Command Handler
    let cmdName: string | undefined;
    if (parse.body.startsWith("=> ") || parse.body === "=>") cmdName = "=>";
    else if (parse.body.startsWith("> ") || parse.body === ">") cmdName = ">";
    else if (parse.body.startsWith(config.prefix))
      [cmdName] = parse.body.slice(config.prefix.length).split(" ");

    if (!cmdName) continue;
    if (isBanned(parse.sender)) continue;
    if (parse.isGroup && getGroup(parse.jid).mute && !parse.isAdmin) continue;

    const cmd = commands.get(cmdName);
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
