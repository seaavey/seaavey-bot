import type { WASocket } from "baileys";
import type { Command } from "@/core/types";
import type { MessageResolver } from "@/utils/message-resolver";
import { TtlMap } from "@/utils/ttl-map";

const cooldowns = new TtlMap<string, number>(300_000);

export async function checkGuards(
  sock: WASocket,
  parse: MessageResolver,
  cmd: Command,
): Promise<boolean> {
  if (cmd.enabled === false) {
    await sock.sendMessage(parse.jid, { text: "🚩 This command is currently disabled." });
    return false;
  }

  if (cmd.ownerOnly && !parse.isOwner) {
    await sock.sendMessage(parse.jid, { text: "🚩 This command is only for the bot owner." });
    return false;
  }

  if (cmd.groupOnly && !parse.isGroup) {
    await sock.sendMessage(parse.jid, { text: "🚩 This command can only be used in groups." });
    return false;
  }

  if (cmd.privateOnly && parse.isGroup) {
    await sock.sendMessage(parse.jid, {
      text: "🚩 This command can only be used in private chats.",
    });
    return false;
  }

  if (cmd.adminOnly && parse.isGroup && !parse.isAdmin) {
    await sock.sendMessage(parse.jid, { text: "🚩 This command is only for group admins." });
    return false;
  }

  if (cmd.botAdmin && parse.isGroup && !parse.isBotAdmin) {
    await sock.sendMessage(parse.jid, {
      text: "🚩 The bot must be an admin to use this command.",
    });
    return false;
  }

  if (cmd.cooldown && cmd.cooldown > 0) {
    const key = `${cmd.command}:${parse.sender}`;
    const lastUsed = cooldowns.get(key);
    if (lastUsed) {
      const remaining = Math.ceil((lastUsed + cmd.cooldown * 1000 - Date.now()) / 1000);
      if (remaining > 0) {
        await sock.sendMessage(parse.jid, { text: `⏳ Wait ${remaining} more seconds.` });
        return false;
      }
    }
    cooldowns.set(key, Date.now(), cmd.cooldown * 1000);
  }

  return true;
}
