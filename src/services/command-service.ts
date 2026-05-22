import { commands } from "@/infra/loader";

export function listCommands() {
  return Array.from(new Set(commands.values())).map((cmd) => ({
    name: cmd.name,
    command: cmd.command ?? cmd.name,
    category: cmd.category || "general",
    description: cmd.description || "",
    enabled: cmd.enabled !== false,
  }));
}

export function findCommand(name: string) {
  return commands.get(name.toLowerCase());
}

export function setCommandEnabled(name: string, enabled: boolean) {
  const cmd = findCommand(name);
  if (!cmd) return null;
  cmd.enabled = enabled;
  return { name: cmd.name, category: cmd.category, enabled: cmd.enabled };
}
