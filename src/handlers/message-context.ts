import type { WASocket } from "baileys";
import type { Group } from "@/infra/repositories/group-repo";
import type { MessageResolver } from "@/utils/message-resolver";

export interface MessageContext {
  sock: WASocket;
  parse: MessageResolver;
  group?: Group;
}

export type MessageMiddleware = (ctx: MessageContext) => Promise<"next" | "stop">;
