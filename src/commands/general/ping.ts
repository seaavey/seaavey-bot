import { cpus, freemem, platform, arch, loadavg, totalmem, uptime as sysUptime } from "node:os";
import db from "@/infra/client";
import { defineCommand } from "@/core/types";
import { formatSize } from "@/utils/helper";
import { config } from "@/core/config";

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts: string[] = [];
  if (d > 0) parts.push(`${d} hari`);
  if (h > 0) parts.push(`${h} jam`);
  if (m > 0) parts.push(`${m} menit`);
  if (s > 0 || parts.length === 0) parts.push(`${s} detik`);
  return parts.join(" ");
}

export default defineCommand({
  name: "Ping",
  alias: ["ping"],
  description: "Check bot and server status details",
  handler: async (_sock, msg) => {
    const handlerStart = performance.now();

    // 1. Database Latency
    const dbStart = performance.now();
    try {
      db.prepare("SELECT 1").get();
    } catch {
      // Ignored
    }
    const dbLatency = (performance.now() - dbStart).toFixed(3);

    // 2. Network / Message Latency
    const rawTime = msg.raw.messageTimestamp;
    let msgTime: number | null = null;
    if (typeof rawTime === "number") {
      msgTime = rawTime;
    } else if (rawTime && typeof rawTime === "object" && "toNumber" in rawTime) {
      msgTime = (rawTime as { toNumber: () => number }).toNumber();
    } else if (rawTime) {
      msgTime = Number(rawTime);
    }

    const netLatency = msgTime ? Math.max(0, Date.now() - msgTime * 1000) : null;

    // 3. System stats
    const totalMem = totalmem();
    const freeMem = freemem();
    const usedMem = totalMem - freeMem;
    const cpuModel = cpus()[0]?.model || "Unknown CPU";
    const cpuCount = cpus().length;
    const loads = loadavg()
      .map((l) => l.toFixed(2))
      .join(" / ");
    const processMem = process.memoryUsage().rss;

    // 4. Calculate Bot Latency up to this point
    const botLatency = (performance.now() - handlerStart).toFixed(3);

    // Format final message
    let text = `⚡ *${config.name} Agus — Ping Info* ⚡\n\n`;
    text += `📶 *Latensi:*\n`;
    text += `- Net Latency: ${netLatency !== null ? `${netLatency} ms` : "N/A"}\n`;
    text += `- DB Latency: ${dbLatency} ms\n`;
    text += `- Bot Latency: ${botLatency} ms\n\n`;

    text += `💻 *Status System:*\n`;
    text += `- OS: ${platform()} (${arch()})\n`;
    text += `- CPU: ${cpuModel} (${cpuCount} Cores)\n`;
    text += `- Load CPU: ${loads}\n`;
    text += `- RAM Bot: ${formatSize(processMem)}\n`;
    text += `- RAM Server: ${formatSize(usedMem)} / ${formatSize(totalMem)}\n\n`;

    text += `⏳ *Uptime:*\n`;
    text += `- Bot: ${formatDuration(process.uptime() * 1000)}\n`;
    text += `- Server: ${formatDuration(sysUptime() * 1000)}\n\n`;

    text += `⚙️ *Runtime:*\n`;
    text += `- Bun: v${Bun.version}\n`;

    await msg.reply(text.trim());
  },
});
