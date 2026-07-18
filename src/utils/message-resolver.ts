import {
  type AnyMessageContent,
  downloadMediaMessage,
  isJidGroup,
  jidNormalizedUser,
  type proto,
  type WAMessage,
  type WASocket,
} from "baileys";
import { config } from "@/core/config";
import { getCachedGroupMetadata } from "@/infra/group-metadata-cache";
import { parseCommandBody } from "@/utils/command-parser";
import { getNumber } from "@/utils/helper";

export interface QuotedMessage {
  id: string | undefined;
  sender: string;
  mtype: keyof proto.Message | undefined;
  body: string;
  imageMessage: proto.Message.IImageMessage | null | undefined;
  videoMessage: proto.Message.IVideoMessage | null | undefined;
  audioMessage: proto.Message.IAudioMessage | null | undefined;
  stickerMessage: proto.Message.IStickerMessage | null | undefined;
  documentMessage: proto.Message.IDocumentMessage | null | undefined;
}

export type MediaMessageType =
  "imageMessage" | "videoMessage" | "audioMessage" | "stickerMessage" | "documentMessage";

export interface MediaMessageByType {
  imageMessage: proto.Message.IImageMessage;
  videoMessage: proto.Message.IVideoMessage;
  audioMessage: proto.Message.IAudioMessage;
  stickerMessage: proto.Message.IStickerMessage;
  documentMessage: proto.Message.IDocumentMessage;
}

export interface ResolvedMediaMessage<T extends MediaMessageType = MediaMessageType> {
  type: T;
  message: MediaMessageByType[T];
  isQuoted: boolean;
  download: () => Promise<Buffer>;
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
  isCommand: boolean;
  prefix: string | undefined;
  commandName: string | undefined;
  message: proto.IMessage | null | undefined;
  key: WAMessage["key"];
  pushName: string | null | undefined;
  messageTimestamp: number | null;
  findMedia: <T extends MediaMessageType>(...types: T[]) => ResolvedMediaMessage<T> | undefined;
  downloadMedia: <T extends MediaMessageType>(...types: T[]) => Promise<Buffer>;
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

const MEDIA_MESSAGE_TYPES = [
  "imageMessage",
  "videoMessage",
  "audioMessage",
  "stickerMessage",
  "documentMessage",
] as const satisfies readonly MediaMessageType[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasToNumber(value: unknown): value is { toNumber: () => number } {
  return isRecord(value) && typeof value.toNumber === "function";
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

function resolveMessageTimestamp(timestamp: unknown): number | null {
  if (typeof timestamp === "number") return timestamp;
  if (typeof timestamp === "bigint") return Number(timestamp);

  if (hasToNumber(timestamp)) {
    return timestamp.toNumber();
  }

  if (!timestamp) return null;

  const value = Number(timestamp);
  return Number.isFinite(value) ? value : null;
}

function getMediaByType<T extends MediaMessageType>(
  message: proto.IMessage | null | undefined,
  type: T,
): MediaMessageByType[T] | null | undefined {
  switch (type) {
    case "imageMessage":
      return (message?.imageMessage ||
        message?.viewOnceMessage?.message?.imageMessage ||
        message?.viewOnceMessageV2?.message?.imageMessage ||
        message?.viewOnceMessageV2Extension?.message?.imageMessage) as
        MediaMessageByType[T] | null | undefined;
    case "videoMessage":
      return (message?.videoMessage ||
        message?.viewOnceMessage?.message?.videoMessage ||
        message?.viewOnceMessageV2?.message?.videoMessage ||
        message?.viewOnceMessageV2Extension?.message?.videoMessage) as
        MediaMessageByType[T] | null | undefined;
    case "audioMessage":
      return message?.audioMessage as MediaMessageByType[T] | null | undefined;
    case "stickerMessage":
      return message?.stickerMessage as MediaMessageByType[T] | null | undefined;
    case "documentMessage":
      return (message?.documentMessage ||
        message?.documentWithCaptionMessage?.message?.documentMessage) as
        MediaMessageByType[T] | null | undefined;
  }
}

function findMediaInMessage<T extends MediaMessageType>(
  message: proto.IMessage | null | undefined,
  types: readonly T[],
): { type: T; message: MediaMessageByType[T] } | undefined {
  for (const type of types) {
    const media = getMediaByType(message, type);
    if (media) return { type, message: media };
  }

  return undefined;
}

function createMediaDownloadMessage<T extends MediaMessageType>(
  key: WAMessage["key"],
  media: { type: T; message: MediaMessageByType[T] },
): WAMessage {
  return {
    key,
    message: { [media.type]: media.message },
  } as WAMessage;
}

async function downloadMediaBuffer(message: WAMessage): Promise<Buffer> {
  return (await downloadMediaMessage(message, "buffer", {
    host: "mmg.whatsapp.net",
  })) as Buffer;
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
  const senderNum = getNumber(identity.sender);

  const participants = await Promise.all(
    metadata.participants.map(async (p) => {
      const resolvedId = p.id.endsWith("@lid") ? await normalizeJid(sock, p.id) : p.id;
      return { ...p, resolvedId };
    }),
  );

  const participant = participants.find((p) => getNumber(p.resolvedId) === senderNum);
  // sock.user?.id format: "62859...:72@s.whatsapp.net" — strip device suffix
  const botNum = getNumber(sock.user?.id ?? "").replace(/:.*$/, "");
  const isBotAdmin = participants.some((p) => p.admin && getNumber(p.resolvedId) === botNum);

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
    documentMessage: quotedMessage.documentMessage,
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

function createMediaActions(msg: WAMessage, quoted: QuotedMessage | undefined) {
  const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  const findMedia = <T extends MediaMessageType>(
    ...types: T[]
  ): ResolvedMediaMessage<T> | undefined => {
    const selectedTypes = (types.length ? types : MEDIA_MESSAGE_TYPES) as readonly T[];
    const currentMedia = findMediaInMessage(msg.message, selectedTypes);
    const quotedMedia = findMediaInMessage(quotedMessage, selectedTypes);
    const media = currentMedia || quotedMedia;

    if (!media) return undefined;

    const isQuoted = !currentMedia && !!quotedMedia;
    const key = isQuoted
      ? { ...msg.key, id: quoted?.id ?? null, participant: quoted?.sender ?? null }
      : msg.key;
    const mediaMessage = createMediaDownloadMessage(key, media);

    return {
      ...media,
      isQuoted,
      download: () => downloadMediaBuffer(mediaMessage),
    };
  };

  const downloadMedia = async <T extends MediaMessageType>(...types: T[]): Promise<Buffer> => {
    const media = findMedia(...types);
    if (!media) throw new Error("No downloadable media found.");
    return media.download();
  };

  return { findMedia, downloadMedia };
}

export async function resolveMessage(sock: WASocket, msg: WAMessage): Promise<MessageResolver> {
  const { jid, sender, isGroup } = await resolveIdentity(sock, msg);
  const { isAdmin, isBotAdmin } = await resolveGroupRoles(sock, { jid, sender, isGroup });
  const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
  const mentioned = contextInfo?.mentionedJid || [];
  const body = extractBody(msg.message);
  const command = parseCommandBody(body, config.prefix);
  const quoted = await resolveQuotedMessage(sock, contextInfo);
  const actions = createMessageActions(sock, jid, msg);
  const mediaActions = createMediaActions(msg, quoted);

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
    args: command.args,
    text: command.text,
    isCommand: command.isCommand,
    prefix: command.prefix,
    commandName: command.commandName,
    message: msg.message,
    key: msg.key,
    pushName: msg.pushName,
    messageTimestamp: resolveMessageTimestamp(msg.messageTimestamp),
    ...mediaActions,
    ...actions,
  };
}
