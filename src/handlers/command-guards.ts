import type { WASocket } from "baileys";
import { config } from "@/core/config";
import type { Command } from "@/core/types";
import type { ParsedMessage } from "@/utils/helper";
import { TtlMap } from "@/utils/ttl-map";

const cooldowns = new TtlMap<string, number>(300_000);

export async function checkGuards(
  sock: WASocket,
  parse: ParsedMessage,
  cmd: Command,
): Promise<boolean> {
  if (cmd.enabled === false) {
    await sock.sendMessage(parse.jid, { text: "⚠️ Command ini sedang dinonaktifkan." });
    return false;
  }

  if (cmd.ownerOnly && !config.owner.includes(parse.sender.replace("@s.whatsapp.net", ""))) {
    await sock.sendMessage(parse.jid, { text: "⚠️ Command ini hanya untuk owner." });
    return false;
  }

  if (cmd.groupOnly && !parse.isGroup) {
    await sock.sendMessage(parse.jid, { text: "⚠️ Command ini hanya bisa digunakan di grup." });
    return false;
  }

  if (cmd.privateOnly && parse.isGroup) {
    await sock.sendMessage(parse.jid, {
      text: "⚠️ Command ini hanya bisa digunakan di private chat.",
    });
    return false;
  }

  if (cmd.adminOnly && parse.isGroup && !parse.isAdmin) {
    await sock.sendMessage(parse.jid, { text: "⚠️ Command ini hanya untuk admin grup." });
    return false;
  }

  if (cmd.botAdmin && parse.isGroup && !parse.isBotAdmin) {
    await sock.sendMessage(parse.jid, {
      text: "⚠️ Bot harus menjadi admin untuk menggunakan command ini.",
    });
    return false;
  }

  if (cmd.cooldown && cmd.cooldown > 0) {
    const key = `${cmd.command}:${parse.sender}`;
    const lastUsed = cooldowns.get(key);
    if (lastUsed) {
      const remaining = Math.ceil((lastUsed + cmd.cooldown * 1000 - Date.now()) / 1000);
      if (remaining > 0) {
        await sock.sendMessage(parse.jid, { text: `⏳ Tunggu ${remaining} detik lagi.` });
        return false;
      }
    }
    cooldowns.set(key, Date.now(), cmd.cooldown * 1000);
  }

  return true;
}
