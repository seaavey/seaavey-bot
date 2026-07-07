import type { WASocket } from "baileys";
import { config } from "@/core/config";
import { logger } from "@/core/logger";
import { checkGuards } from "@/handlers/command-guards";
import { commands } from "@/core/loader";
import { getGroup } from "@/infra/repositories/group-repo";
import { addHit, getUser, isBanned } from "@/infra/repositories/user-repo";
import { getNumber } from "@/utils/helper";
import type { MessageResolver } from "@/utils/message-resolver";

export async function dispatchCommand(sock: WASocket, parse: MessageResolver) {
  if (!parse.commandName) return;
  if (isBanned(parse.sender)) return;
  if (config.accessMode === "self" && !parse.fromMe) return;
  if (config.accessMode === "private" && !parse.fromMe && !parse.isOwner) return;
  if (parse.isGroup && getGroup(parse.jid)?.mute && !parse.isAdmin) return;

  const cmd = commands.get(parse.commandName.toLowerCase());
  if (!cmd) return;

  const guardResult = await checkGuards(sock, parse, cmd);
  if (!guardResult) return;

  addHit(parse.sender);
  const user = getUser(parse.sender);
  const prevLevel = user?.level ?? 0;
  try {
    await cmd.handler(sock, parse);
  } catch (e) {
    logger.error(e);
  }
  const after = getUser(parse.sender);
  if (after && after.level > prevLevel) {
    await sock.sendMessage(parse.jid, {
      text: `🎉 *Level Up!*

@${getNumber(parse.sender)} leveled up to *${after.level}*! 🏆`,
      mentions: [parse.sender],
    });
  }
}
