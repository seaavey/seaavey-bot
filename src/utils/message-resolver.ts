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
  quoted:
    | {
        id: MessageResolver["id"];
        sender: string;
        mtype: keyof proto.Message | undefined;
        body: string;
        imageMessage: proto.Message.IImageMessage | null | undefined;
        videoMessage: proto.Message.IVideoMessage | null | undefined;
        audioMessage: proto.Message.IAudioMessage | null | undefined;
        stickerMessage: proto.Message.IStickerMessage | null | undefined;
      }
    | undefined;
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

export async function resolveMessage(sock: WASocket, msg: WAMessage): Promise<MessageResolver> {
  // Helper function to convert LID to JID
  const LIDToJid = async (lid: string): Promise<string | null> => {
    if (lid.endsWith("@g.us")) return lid;
    if (lid.endsWith("@s.whatsapp.net")) return lid;
    const jid = await sock.signalRepository.lidMapping.getPNForLID(lid);
    return jidNormalizedUser(jid ?? undefined) || lid;
  };

  const key = msg.key;
  const mid = key.id || "";
  const isGroup = isJidGroup(key.remoteJid ?? "") || false;
  const jid = key.remoteJidAlt || (await LIDToJid(key.remoteJid || "")) || "";
  const sender = isGroup
    ? key.participantAlt || (await LIDToJid(key.participant || "")) || ""
    : jid;

  let isAdmin = false;
  let isBotAdmin = false;

  if (isGroup) {
    const metadata = await getCachedGroupMetadata(sock, jid);
    const participant = metadata.participants.find((p) => (p.phoneNumber || p.id) === sender);

    isAdmin = !!participant?.admin;
    const botId = jidNormalizedUser(sock.user?.id);
    isBotAdmin = metadata.participants.some((p) => p.admin && (p.phoneNumber || p.id) === botId);
  }

  const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
  const mentioned = contextInfo?.mentionedJid || [];

  const body = extractBody(msg.message);
  const args = body.split(" ").slice(1);
  const qm = contextInfo?.quotedMessage;
  const qKey = qm ? (Object.keys(qm)[0] as keyof proto.Message) : undefined;
  const quoted = contextInfo?.stanzaId
    ? {
        id: contextInfo.stanzaId ?? undefined,
        sender: (await LIDToJid(contextInfo.participant || "")) || "",
        mtype: qKey,
        body: extractBody(qm),
        imageMessage: qm?.imageMessage,
        videoMessage: qm?.videoMessage,
        audioMessage: qm?.audioMessage,
        stickerMessage: qm?.stickerMessage,
      }
    : undefined;

  return {
    id: mid,
    jid,
    sender,
    body,
    fromMe: !!key.fromMe,
    isGroup,
    isAdmin,
    isBotAdmin,
    isOwner: config.owner.includes(sender.replace(/@.+/, "")),
    mentioned,
    quoted,
    mtype: msg.message ? (Object.keys(msg.message)[0] as keyof proto.Message) : undefined,
    args,
    text: args.join(" "),
    message: msg.message,
    key: msg.key,
    pushName: msg.pushName,
    raw: msg,
    react: async (emoji) => {
      await sock.sendMessage(jid, { react: { text: emoji, key: msg.key } });
    },
    reply: async (text) => {
      const mentions = [...text.matchAll(/@(\d+)/g)].map((m) => `${m[1]}@s.whatsapp.net`);
      await sock.sendMessage(jid, { text, mentions }, { quoted: msg });
    },
    send: async (content) => {
      await sock.sendMessage(jid, content, { quoted: msg });
    },
  };
}
