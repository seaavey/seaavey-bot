import type { ParsedMessage } from "./helper";
import type { WASocket } from "baileys";
export interface Command {
  name: string;
  category: string;
  description?: string;
  handler: (sock: WASocket, msg: ParsedMessage) => Promise<void>;
}

export function defineCommand(cmd: Omit<Command, "category">) {
  return cmd;
}
