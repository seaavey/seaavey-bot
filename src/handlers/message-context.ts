import type { WAMessage, WASocket } from "baileys";
import type { Group } from "@/infra/repositories/group-repo";
import type { ParsedMessage } from "@/utils/helper";

export interface MessageContext {
  sock: WASocket;
  raw: WAMessage;
  parse: ParsedMessage;
  group?: Group;
}

export type MessageMiddleware = (ctx: MessageContext) => Promise<"next" | "stop">;
