import type { WASocket } from "baileys";
import { config } from "@/core/config";
import { logger } from "@/core/logger";
import { checkGuards } from "@/handlers/command-guards";
import { commands } from "@/infra/loader";
import { getGroup } from "@/infra/repositories/group-repo";
import { addHit, getUser, isBanned } from "@/infra/repositories/user-repo";
import { getNumber, type ParsedMessage } from "@/utils/helper";

export async function dispatchCommand(sock: WASocket, parse: ParsedMessage) {
  let cmdName: string | undefined;
  if (parse.body.startsWith("=> ") || parse.body === "=>") cmdName = "=>";
  else if (parse.body.startsWith("> ") || parse.body === ">") cmdName = ">";
  else if (parse.body.startsWith(config.prefix))
    [cmdName] = parse.body.slice(config.prefix.length).split(" ");

  if (!cmdName) return;
  if (isBanned(parse.sender)) return;
  if (parse.isGroup && getGroup(parse.jid).mute && !parse.isAdmin) return;

  const cmd = commands.get(cmdName.toLowerCase());
  if (!cmd) return;

  const guardResult = await checkGuards(sock, parse, cmd);
  if (!guardResult) return;

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
