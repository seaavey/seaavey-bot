import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import type { Boom } from "@hapi/boom";
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "baileys";
import * as QRCode from "qrcode";
import { updateMemberChat } from "@/infra/database";
import { handleGroupParticipants } from "@/handlers/group-handler";
import { loadCommands } from "@/infra/loader";
import { logger } from "@/core/logger";
import { handleMessagesUpdate, handleMessagesUpsert } from "@/handlers/message-handler";
import { startSchedulers } from "@/infra/scheduler";

async function startBot() {
  await loadCommands();

  const isRegistered = existsSync("auth/creds.json");
  let pairingNumber: string | undefined;

  if (!isRegistered) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    pairingNumber = await new Promise<string>((r) =>
      rl.question("Masukkan nomor WhatsApp (contoh: 62123456789): ", r),
    );
    rl.close();
  }

  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({ auth: state, logger });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      if (pairingNumber) {
        const code = await sock.requestPairingCode(pairingNumber);
        logger.info(`Pairing code: ${code}`);
      } else {
        await QRCode.toFile("qr.png", qr);
        logger.info("QR code saved to qr.png");
      }
    }

    if (connection === "close") {
      const error = lastDisconnect?.error as Boom | undefined;
      const shouldReconnect = error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
      else logger.info("Logged out.");
    } else if (connection === "open") {
      logger.info("Connected to WhatsApp!");
      startSchedulers(sock);
    }
  });

  // Anti Call
  sock.ev.on("call", async (calls) => {
    for (const call of calls) {
      if (call.status === "offer") {
        await sock.rejectCall(call.id, call.from);
        await sock.sendMessage(call.from, {
          text: "🚫 Maaf, bot tidak menerima panggilan. Silakan kirim pesan teks.",
        });
      }
    }
  });

  // Group Events
  sock.ev.on("groups.upsert", async (groups) => {
    for (const group of groups) {
      for (const p of group.participants) {
        updateMemberChat(group.id, p.phoneNumber || p.id);
      }
      logger.info(`Registered members from ${group.subject}`);
    }
  });

  sock.ev.on("group-participants.update", (data) =>
    handleGroupParticipants(sock, {
      id: data.id,
      participants: data.participants.map((p) => p.id),
      action: data.action,
    }),
  );

  // Message Events
  sock.ev.on("messages.upsert", ({ messages }) => handleMessagesUpsert(sock, messages));
  sock.ev.on("messages.update", (updates) => handleMessagesUpdate(sock, updates));
}

startBot();
