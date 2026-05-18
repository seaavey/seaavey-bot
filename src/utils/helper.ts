import type { AnyMessageContent, proto, WAMessage, WASocket } from "baileys";
import { config } from "@/core/config";
export interface ParsedMessage {
  id: string | undefined;
  jid: string;
  lid: string;
  sender: string;
  body: string;
  isGroup: boolean;
  isAdmin: boolean;
  isBotAdmin: boolean;
  fromMe: boolean;
  isOwner: boolean;
  mentioned: string[];
  quoted: string | undefined;
  args: string[];
  msg: WAMessage;
  reply: (text: string) => Promise<void>;
  send: (content: AnyMessageContent) => Promise<void>;
}

function extractBody(m: proto.IMessage | null | undefined): string {
  if (m?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
    try {
      const params = JSON.parse(m.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
      if (params.id) return params.id;
    } catch {}
  }
  return (
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    m?.imageMessage?.caption ||
    m?.videoMessage?.caption ||
    m?.templateButtonReplyMessage?.selectedId ||
    ""
  );
}

export async function parseMessage(sock: WASocket, msg: WAMessage): Promise<ParsedMessage> {
  const key = msg.key;
  const isGroup = !!key.remoteJid?.endsWith("@g.us");
  const sender = key.participantAlt || key.participant || key.remoteJidAlt || key.remoteJid;
  const jid = key.remoteJid || "";

  let isAdmin = false;
  let isBotAdmin = false;

  if (isGroup) {
    const metadata = await sock.groupMetadata(jid);
    const adminIds = metadata.participants.filter((p) => p.admin).map((p) => p.id);
    const adminPns = metadata.participants.filter((p) => p.admin).map((p) => p.phoneNumber || "");
    const senderLid = key.participant;
    const senderJid = key.participantAlt;
    isAdmin =
      adminIds.includes(senderLid || "") ||
      adminIds.includes(senderJid || "") ||
      adminPns.includes(senderJid || "");
    const botId = `${sock.user?.id?.replace(/:\d+/, "")}@s.whatsapp.net`;
    const botLid = sock.user?.lid?.replace(/:\d+/, "");
    isBotAdmin =
      adminIds.includes(botId) || adminIds.includes(botLid || "") || adminPns.includes(botId);
  }

  const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
  const lidToJid = (id: string) => id.replace(/:\d+@/, "@");
  const mentioned = (contextInfo?.mentionedJid || []).map(lidToJid);
  const quoted = contextInfo?.participant ? lidToJid(contextInfo.participant) : undefined;
  const body = extractBody(msg.message);
  const args = body.split(" ").slice(1);

  return {
    id: key.id ?? undefined,
    jid: key.remoteJidAlt || key.remoteJid || "",
    lid: key.remoteJid || "",
    sender: sender || "",
    body,
    fromMe: !!key.fromMe,
    isGroup,
    isAdmin,
    isBotAdmin,
    isOwner: config.owner.includes(sender?.replace(/@.+/, "") || ""),
    mentioned,
    quoted,
    args,
    msg,
    reply: async (text) => {
      const mentions = [...text.matchAll(/@(\d+)/g)].map((m) => `${m[1]}@s.whatsapp.net`);
      await sock.sendMessage(jid, { text, mentions }, { quoted: msg });
    },
    send: async (content) => {
      await sock.sendMessage(jid, content, { quoted: msg });
    },
  };
}

export function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getNumber(jid: string): string {
  return jid.replace(/@.+/, "");
}
