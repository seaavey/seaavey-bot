import { watch } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { isDev } from "@/core/config";
import { logger } from "@/core/logger";
import type { Command } from "@/core/types";

const COMMANDS_DIR = join(import.meta.dir, "..", "commands");

export const commands = new Map<string, Command>();

async function loadFile(path: string) {
  const category = basename(dirname(path));
  const mod = await import(path);
  const cmd: Command = mod.default;
  if (!cmd?.name) return;

  cmd.category = category;

  const filenameTrigger = basename(path).replace(/\.ts$/, "").toLowerCase();
  const triggerSet = new Set<string>();

  if (cmd.triggers?.length) {
    for (const t of cmd.triggers) triggerSet.add(t.toLowerCase());
  }
  if (cmd.command) triggerSet.add(cmd.command.toLowerCase());
  triggerSet.add(filenameTrigger);
  if (cmd.alias?.length) {
    for (const a of cmd.alias) triggerSet.add(a.toLowerCase());
  }

  if (!cmd.command) cmd.command = filenameTrigger;

  for (const trigger of triggerSet) {
    if (commands.has(trigger) && commands.get(trigger)?.name !== cmd.name) {
      logger.warn(
        `Duplicate trigger "${trigger}" from "${cmd.name}" (already registered by "${commands.get(trigger)?.name}")`,
      );
      continue;
    }
    commands.set(trigger, cmd);
  }

  logger.info(`Loaded command: ${cmd.name} [${category}]`);
}

async function scanAll() {
  commands.clear();
  const categories = await readdir(COMMANDS_DIR, { withFileTypes: true });
  for (const cat of categories) {
    if (!cat.isDirectory()) continue;
    const files = await readdir(join(COMMANDS_DIR, cat.name));
    for (const file of files) {
      if (!file.endsWith(".ts")) continue;
      await loadFile(join(COMMANDS_DIR, cat.name, file));
    }
  }
}

function watchCommands() {
  watch(COMMANDS_DIR, { recursive: true }, async (_, filename) => {
    if (!filename?.endsWith(".ts")) return;
    const path = join(COMMANDS_DIR, filename);
    try {
      delete require.cache[path];
      await loadFile(path);
      logger.info(`Hot-reloaded: ${filename}`);
    } catch {
      logger.warn(`Failed to reload: ${filename}`);
    }
  });
  logger.info("Watching commands/ for changes (dev mode)");
}

export async function loadCommands() {
  await scanAll();
  if (isDev) watchCommands();
}
