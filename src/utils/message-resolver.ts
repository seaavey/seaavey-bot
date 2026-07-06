import {
  type AnyMessageContent,
  isJidGroup,
  jidNormalizedUser,
  type proto,
  type WAMessage,
  type WASocket,
} from "baileys";
import { config } from "@/core/config";
import { getCachedGroupMetadata } from "@/infra/group-metadata-cache";

export interface QuotedMessage {
  id: string | undefined;
  sender: string;
  mtype: keyof proto.Message | undefined;
  body: string;
  imageMessage: proto.Message.IImageMessage | null | undefined;
  videoMessage: proto.Message.IVideoMessage | null | undefined;
  audioMessage: proto.Message.IAudioMessage | null | undefined;
  stickerMessage: proto.Message.IStickerMessage | null | undefined;
}

export interface MessageResolver {
  id: string | undefined;
  jid: string;
  sender: string;
  body: string;
  isGroup: boolean;
  isAdmin: boolean;
  isBotAdmin: boolean;
  fromMe: boolean;
  isOwner: boolean;
  mentioned: string[];
  mtype: keyof proto.Message | undefined;
  quoted: QuotedMessage | undefined;
  args: string[];
  text: string;
  message: proto.IMessage | null | undefined;
  key: WAMessage["key"];
  pushName: string | null | undefined;
  raw: WAMessage;
  react: (emoji: string) => Promise<void>;
  reply: (text: string) => Promise<void>;
  send: (content: AnyMessageContent) => Promise<void>;
}

interface MessageIdentity {
  jid: string;
  sender: string;
  isGroup: boolean;
}

interface GroupRoles {
  isAdmin: boolean;
  isBotAdmin: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNativeFlowId(paramsJson: string): string | null {
  try {
    const params = JSON.parse(paramsJson) as unknown;
    if (!isRecord(params)) return null;
    return typeof params.id === "string" ? params.id : null;
  } catch {
    return null;
  }
}

function extractBody(m: proto.IMessage | null | undefined): string {
  const paramsJson = m?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
  if (paramsJson) {
    const nativeFlowId = readNativeFlowId(paramsJson);
    if (nativeFlowId) return nativeFlowId;
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

function getMessageType(
  message: proto.IMessage | null | undefined,
): keyof proto.Message | undefined {
  return message ? (Object.keys(message)[0] as keyof proto.Message) : undefined;
}

async function normalizeJid(sock: WASocket, jid: string): Promise<string> {
  if (!jid) return "";
  if (jid.endsWith("@g.us")) return jid;
  if (jid.endsWith("@s.whatsapp.net")) return jid;

  const phoneNumber = await sock.signalRepository.lidMapping.getPNForLID(jid);
  return jidNormalizedUser(phoneNumber ?? undefined) || jid;
}

async function resolveIdentity(sock: WASocket, msg: WAMessage): Promise<MessageIdentity> {
  const key = msg.key;
  const isGroup = isJidGroup(key.remoteJid ?? "") || false;
  const jid = key.remoteJidAlt || (await normalizeJid(sock, key.remoteJid || ""));
  const sender = isGroup
    ? key.participantAlt || (await normalizeJid(sock, key.participant || ""))
    : jid;

  return { jid, sender, isGroup };
}

async function resolveGroupRoles(sock: WASocket, identity: MessageIdentity): Promise<GroupRoles> {
  if (!identity.isGroup) return { isAdmin: false, isBotAdmin: false };

  const metadata = await getCachedGroupMetadata(sock, identity.jid);
  const participant = metadata.participants.find(
    (p) => (p.phoneNumber || p.id) === identity.sender,
  );
  const botId = jidNormalizedUser(sock.user?.id);
  const isBotAdmin = metadata.participants.some(
    (p) => p.admin && (p.phoneNumber || p.id) === botId,
  );

  return { isAdmin: !!participant?.admin, isBotAdmin };
}

async function resolveQuotedMessage(
  sock: WASocket,
  contextInfo: proto.IContextInfo | null | undefined,
): Promise<QuotedMessage | undefined> {
  const quotedMessage = contextInfo?.quotedMessage;
  if (!contextInfo?.stanzaId || !quotedMessage) return undefined;

  return {
    id: contextInfo.stanzaId ?? undefined,
    sender: await normalizeJid(sock, contextInfo.participant || ""),
    mtype: getMessageType(quotedMessage),
    body: extractBody(quotedMessage),
    imageMessage: quotedMessage.imageMessage,
    videoMessage: quotedMessage.videoMessage,
    audioMessage: quotedMessage.audioMessage,
    stickerMessage: quotedMessage.stickerMessage,
  };
}

function createMessageActions(sock: WASocket, jid: string, msg: WAMessage) {
  return {
    react: async (emoji: string) => {
      await sock.sendMessage(jid, { react: { text: emoji, key: msg.key } });
    },
    reply: async (text: string) => {
      const mentions = [...text.matchAll(/@(\d+)/g)].map((m) => `${m[1]}@s.whatsapp.net`);
      await sock.sendMessage(jid, { text, mentions }, { quoted: msg });
    },
    send: async (content: AnyMessageContent) => {
      await sock.sendMessage(jid, content, { quoted: msg });
    },
  };
}

export async function resolveMessage(sock: WASocket, msg: WAMessage): Promise<MessageResolver> {
  const { jid, sender, isGroup } = await resolveIdentity(sock, msg);
  const { isAdmin, isBotAdmin } = await resolveGroupRoles(sock, { jid, sender, isGroup });
  const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
  const mentioned = contextInfo?.mentionedJid || [];
  const body = extractBody(msg.message);
  const args = body.split(" ").slice(1);
  const quoted = await resolveQuotedMessage(sock, contextInfo);
  const actions = createMessageActions(sock, jid, msg);

  return {
    id: msg.key.id || "",
    jid,
    sender,
    body,
    fromMe: !!msg.key.fromMe,
    isGroup,
    isAdmin,
    isBotAdmin,
    isOwner: config.owner.includes(sender.replace(/@.+/, "")),
    mentioned,
    quoted,
    mtype: getMessageType(msg.message),
    args,
    text: args.join(" "),
    message: msg.message,
    key: msg.key,
    pushName: msg.pushName,
    raw: msg,
    ...actions,
  };
}
