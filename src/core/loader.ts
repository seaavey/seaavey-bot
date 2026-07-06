import { existsSync, watch } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { isDev } from "@/core/config";
import { logger } from "@/core/logger";
import type { Command } from "@/core/types";

const COMMANDS_DIR = join(import.meta.dir, "..", "commands");

export const commands = new Map<string, Command>();
const commandTriggersByFile = new Map<string, Set<string>>();

function collectTriggers(path: string, cmd: Command): Set<string> {
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

  return triggerSet;
}

function unregisterFile(path: string) {
  const triggers = commandTriggersByFile.get(path);
  if (!triggers) return;

  for (const trigger of triggers) {
    commands.delete(trigger);
  }
  commandTriggersByFile.delete(path);
}

async function importCommand(path: string): Promise<Command | null> {
  const importPath = isDev ? `${path}?t=${Date.now()}` : path;
  const mod = (await import(importPath)) as { default?: Command };
  return mod.default ?? null;
}

async function loadFile(path: string) {
  const category = basename(dirname(path));
  const cmd = await importCommand(path);
  if (!cmd?.name) {
    unregisterFile(path);
    return;
  }

  cmd.category = category;

  const triggerSet = collectTriggers(path, cmd);
  const registeredTriggers = new Set<string>();

  unregisterFile(path);

  for (const trigger of triggerSet) {
    if (commands.has(trigger) && commands.get(trigger)?.name !== cmd.name) {
      logger.warn(
        `Duplicate trigger "${trigger}" from "${cmd.name}" (already registered by "${commands.get(trigger)?.name}")`,
      );
      continue;
    }
    commands.set(trigger, cmd);
    registeredTriggers.add(trigger);
  }

  commandTriggersByFile.set(path, registeredTriggers);
}

async function scanAll() {
  commands.clear();
  commandTriggersByFile.clear();
  const categories = await readdir(COMMANDS_DIR, { withFileTypes: true });
  for (const cat of categories) {
    if (!cat.isDirectory()) continue;
    const files = await readdir(join(COMMANDS_DIR, cat.name));
    for (const file of files) {
      if (!file.endsWith(".ts")) continue;
      await loadFile(join(COMMANDS_DIR, cat.name, file));
    }
  }
  const unique = new Set(commands.values()).size;
  logger.info(`Load: ${unique}`);
}

function watchCommands() {
  watch(COMMANDS_DIR, { recursive: true }, async (_, filename) => {
    if (!filename?.endsWith(".ts")) return;
    const path = join(COMMANDS_DIR, filename);
    if (!existsSync(path)) {
      unregisterFile(path);
      logger.info(`Unloaded: ${filename}`);
      return;
    }

    try {
      await loadFile(path);
      logger.info(`Hot-reloaded: ${filename}`);
    } catch (error) {
      logger.warn({ error }, `Failed to reload: ${filename}`);
    }
  });
  logger.info("Watching commands/ for changes (dev mode)");
}

export async function loadCommands() {
  await scanAll();
  if (isDev) watchCommands();
}
