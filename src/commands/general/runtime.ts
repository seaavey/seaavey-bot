import { defineCommand } from "@/core/types";
const startTime = Date.now();

export default defineCommand({
  name: "runtime",
  description: "Lihat uptime bot",
  handler: async (_sock, msg) => {
    const ms = Date.now() - startTime;
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000) % 24;
    const d = Math.floor(ms / 86400000);
    await msg.reply(`⏱️ Uptime: ${d}d ${h}h ${m}m ${s}s`);
  },
});
