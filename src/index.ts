import { createInterface } from "node:readline";
import type { Boom } from "@hapi/boom";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  isJidStatusBroadcast,
} from "baileys";
import * as QRCode from "qrcode";
import { logger, createEventLogger } from "@/core/logger";
import { handleGroupParticipants } from "@/handlers/group-handler";
import { handleMessagesUpdate, handleMessagesUpsert } from "@/handlers/message-handler";
import { setGroup, updateMemberChat } from "@/infra/database";
import { invalidateGroupMetadata } from "@/infra/group-metadata-cache";
import { loadCommands } from "@/core/loader";
import { startSchedulers } from "@/infra/scheduler";

let isRestarting = false;
let restartAttempts = 0;
let currentSock: ReturnType<typeof makeWASocket> | null = null;
let cachedPairingNumber: string | null = null;

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Unhandled rejection — connection handler will recover");
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception — exiting");
  process.exit(1);
});

async function startBot() {
  // Cleanup old socket before creating a new one
  if (currentSock) {
    try {
      currentSock.end(undefined);
    } catch {}
  }

  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version, isLatest } = await fetchLatestBaileysVersion();

  logger.info(`Version: ${version.join(".")} (Latest: ${isLatest}), using Latest WA version`);

  const sock = makeWASocket({
    version,
    // browser: Browsers.ubuntu("Chrome"),
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    logger,
    defaultQueryTimeoutMs: 60000,
    retryRequestDelayMs: 300,
    maxMsgRetryCount: 10,
    auth: state,
    markOnlineOnConnect: false,
    syncFullHistory: true,
    shouldIgnoreJid: (jid: string) => isJidStatusBroadcast(jid),
    linkPreviewImageThumbnailWidth: 192,
    generateHighQualityLinkPreview: true,
    enableAutoSessionRecreation: true,
    enableRecentMessageCache: true,
    appStateMacVerification: {
      patch: false,
      snapshot: false,
    },
  });
  currentSock = sock;
  const evLog = {
    connection: createEventLogger("connection.update"),
    call: createEventLogger("call"),
    groupsUpsert: createEventLogger("groups.upsert"),
    groupParticipants: createEventLogger("group-participants.update"),
    messagesUpsert: createEventLogger("messages.upsert"),
    messagesUpdate: createEventLogger("messages.update"),
  };

  sock.ev.on("creds.update", () => saveCreds());

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    evLog.connection.info({ connection, qr: !!qr }, "connection update received");
    if (qr && !cachedPairingNumber) {
      await QRCode.toFile("qr.png", qr);
      logger.info("QR code saved to qr.png");
    }

    if (connection === "close") {
      const error = lastDisconnect?.error as Boom | undefined;
      if (error?.output?.statusCode === DisconnectReason.loggedOut) {
        logger.info("Logged out.");
        return;
      }
      if (isRestarting) return;
      isRestarting = true;
      const delay = Math.min(1000 * 2 ** restartAttempts, 60_000);
      restartAttempts++;
      logger.warn({ delay }, `Connection closed, reconnecting in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      try {
        await startBot();
        restartAttempts = 0;
      } finally {
        isRestarting = false;
      }
    } else if (connection === "open") {
      restartAttempts = 0;
      logger.info("Connected to WhatsApp!");
      startSchedulers(sock);
    }
  });

  if (!state.creds.registered && !state.creds.me?.id) {
    let pairingNumber = cachedPairingNumber;
    if (pairingNumber === null) {
      if (process.stdin.isTTY) {
        const rl = createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        const input = await new Promise<string>((resolve) => {
          rl.question(
            "Enter WhatsApp number for pairing code (leave empty for QR code): ",
            (answer) => {
              resolve(answer);
            },
          );
          rl.once("close", () => {
            resolve("");
          });
        });
        rl.close();
        pairingNumber = input.trim();
      } else {
        pairingNumber = "";
      }
      cachedPairingNumber = pairingNumber;
    }

    if (pairingNumber) {
      try {
        await sock.waitForSocketOpen();
        const code = await sock.requestPairingCode(pairingNumber);
        logger.info(`\n📱 Pairing code: ${code}`);
        process.stdout.write(`\n📱 Pairing code: ${code}\n\n`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error({ error }, "Failed to get pairing code");
        process.stdout.write(`\n🚩 Error: ${msg}\n\n`);
        cachedPairingNumber = null;
      }
    }
  }

  // Anti Call
  sock.ev.on("call", async (calls) => {
    evLog.call.info({ count: calls.length }, "incoming call");
    for (const call of calls) {
      if (call.status === "offer") {
        await sock.rejectCall(call.id, call.from);
        await sock.sendMessage(call.from, {
          text: "🚫 Sorry, the bot does not accept calls. Please send a text message.",
        });
      }
    }
  });

  // Group Events
  sock.ev.on("groups.upsert", async (groups) => {
    evLog.groupsUpsert.info({ count: groups.length }, "new/updated group");
    for (const group of groups) {
      invalidateGroupMetadata(group.id);
      setGroup(group.id, "name", group.subject || "");
      for (const p of group.participants) {
        updateMemberChat(group.id, p.phoneNumber || p.id);
      }
      logger.info(`Registered members from ${group.subject}`);
    }
  });

  sock.ev.on("group-participants.update", (data) => {
    evLog.groupParticipants.info(
      { group: data.id, action: data.action, participants: data.participants.length },
      "participant update",
    );
    handleGroupParticipants(sock, {
      id: data.id,
      participants: data.participants.map((p) => p.id),
      action: data.action,
    });
  });

  // Message Events
  sock.ev.on("messages.upsert", ({ messages }) => {
    evLog.messagesUpsert.info({ count: messages.length }, "message received");
    handleMessagesUpsert(sock, messages);
  });
  sock.ev.on("messages.update", (updates) => {
    evLog.messagesUpdate.info({ count: updates.length }, "message updated");
    handleMessagesUpdate(sock, updates);
  });
}

async function main() {
  await loadCommands();
  await startBot();
}

main();
