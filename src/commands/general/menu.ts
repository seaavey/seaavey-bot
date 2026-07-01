import { readFileSync } from "node:fs";
import { config } from "@/core/config";
import { type Command, defineCommand } from "@/core/types";
import { sendInteractive } from "@/handlers/interactive";
import { getUser } from "@/infra/database";
import { commands } from "@/infra/loader";
import { getNumber } from "@/utils/helper";

const categoryIcons: Record<string, string> = {
  general: "⚙️",
  fun: "🎮",
  game: "🎯",
  group: "👥",
  owner: "👑",
  downloader: "📥",
  economy: "💰",
  info: "ℹ️",
  search: "🔍",
  tools: "🛠️",
  productivity: "📋",
};

export default defineCommand({
  name: "Menu",
  alias: ["menu"],
  description: "Show the command list",
  handler: async (sock, msg) => {
    const seen = new Set<Command>();
    const categories = new Map<string, { title: string; id: string; description: string }[]>();
    for (const cmd of commands.values()) {
      if (seen.has(cmd)) continue;
      seen.add(cmd);
      const list = categories.get(cmd.category) || [];
      const trigger = cmd.command ?? cmd.name;
      list.push({
        title: cmd.name,
        id: `${config.prefix[0]}${trigger}`,
        description: cmd.description || "No description",
      });
      categories.set(cmd.category, list);
    }

    const targetCategory = msg.args[0]?.toLowerCase();

    if (targetCategory) {
      if (!categories.has(targetCategory)) {
        await msg.reply(
          `🚩 Category *${targetCategory}* not found.\nAvailable categories: ${Array.from(categories.keys()).join(", ")}`,
        );
        return;
      }

      const cmds = categories.get(targetCategory);
      if (!cmds) return;

      let text = `*${targetCategory.toUpperCase()}*\n`;
      for (const cmd of cmds) {
        text += `*${cmd.title}* - ${cmd.description}\n`;
      }
      await msg.reply(text);
      return;
    }

    const user = getUser(msg.sender);
    const level = user?.level ?? 1;
    const xp = user?.xp ?? 0;
    const hits = user?.hits ?? 0;
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);

    let caption = `╭━━━━[ *${config.name}* ]━━━━\n`;
    caption += `┃ 👤 @${getNumber(msg.sender)}\n`;
    caption += `┃ 🏆 Level ${level} (${xp} XP)\n`;
    caption += `┃ 📊 Hits: ${hits}\n`;
    caption += `┃ ⏱️ Uptime: ${hours}h ${mins}m\n`;
    caption += `┃ 📦 Total: ${commands.size} commands\n`;
    caption += `╰━━━━━━━━━━━━━━━━\n\n`;
    caption += `_Tap the button below to browse the command list._`;

    const sections = [];
    const sorted = Array.from(categories.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const categoryRows = [];

    for (const [category, cmds] of sorted) {
      const icon = categoryIcons[category] || "📂";
      categoryRows.push({
        title: `${icon} ${category.toUpperCase()}`,
        id: `${config.prefix[0]}menu ${category}`,
        description: `Show ${cmds.length} commands in this category`,
      });
    }

    sections.push({
      title: "Choose Category",
      rows: categoryRows,
    });

    try {
      await sendInteractive(sock, msg.jid, {
        body: caption,
        footer: "SeaaveyBot Open Source",
        header: {
          image: readFileSync("src/assets/banner.png"),
        },
        buttons: [
          {
            name: "single_select",
            params: {
              title: "Show Menu",
              sections: sections,
            },
          },
          {
            name: "cta_url",
            params: {
              display_text: "Source Code",
              url: "https://github.com/seaavey/seaavey-bot",
            },
          },
        ],
        mentions: [msg.sender],
      });
    } catch {
      await msg.reply("🚩 Failed to send menu.");
    }
  },
});
