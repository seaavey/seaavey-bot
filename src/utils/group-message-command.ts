import { defineCommand } from "@/core/types";
import { getGroup, setGroup, type Group } from "@/infra/database";

type ToggleField = "welcome" | "goodbye";
type MessageField = "welcomeMsg" | "goodbyeMsg";

interface GroupMessageCommandConfig {
  name: string;
  alias: string[];
  field: ToggleField;
  messageField: MessageField;
  label: string;
}

const ENABLE_WORDS = new Set(["on", "enable", "aktif"]);
const DISABLE_WORDS = new Set(["off", "disable", "mati"]);
const RESET_WORDS = new Set(["reset", "default"]);

function isEnabled(group: Group, field: ToggleField): boolean {
  return Boolean(group[field]);
}

function usage(command: string, label: string): string {
  return [
    `📝 Usage:`,
    `• .${command}`,
    `• .${command} on/off`,
    `• .${command} Halo @user, selamat datang di {group}`,
    `• .${command} reset`,
    "",
    `Placeholder: @user, {user}, {users}, {group}`,
    `Command ini buat ngatur pesan ${label.toLowerCase()}.`,
  ].join("\n");
}

export function groupMessageCommand({
  name,
  alias,
  field,
  messageField,
  label,
}: GroupMessageCommandConfig) {
  return defineCommand({
    name,
    alias,
    description: `Toggle or set ${label.toLowerCase()} message`,
    groupOnly: true,
    adminOnly: true,
    handler: async (_sock, msg) => {
      const group = getGroup(msg.jid);
      const command = msg.commandName || alias[0] || name.toLowerCase();
      const subcommand = msg.args[0]?.toLowerCase();

      if (!subcommand) {
        const enabled = isEnabled(group, field) ? 0 : 1;
        setGroup(msg.jid, field, enabled);
        return msg.reply(`✅ ${label} ${enabled ? "diaktifkan" : "dinonaktifkan"}.`);
      }

      if (subcommand === "help") {
        return msg.reply(usage(command, label));
      }

      if (ENABLE_WORDS.has(subcommand)) {
        setGroup(msg.jid, field, 1);
        return msg.reply(`✅ ${label} diaktifkan.`);
      }

      if (DISABLE_WORDS.has(subcommand)) {
        setGroup(msg.jid, field, 0);
        return msg.reply(`✅ ${label} dinonaktifkan.`);
      }

      if (RESET_WORDS.has(subcommand)) {
        setGroup(msg.jid, messageField, "");
        return msg.reply(`✅ ${label} message reset ke default.`);
      }

      const text = subcommand === "set" ? msg.args.slice(1).join(" ") : msg.text;
      if (!text) return msg.reply(usage(command, label));

      setGroup(msg.jid, messageField, text);
      setGroup(msg.jid, field, 1);
      return msg.reply(`✅ Pesan ${label.toLowerCase()} diupdate dan diaktifkan.`);
    },
  });
}
