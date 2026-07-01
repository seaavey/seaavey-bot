import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Speed",
  alias: ["spd", "speed"],
  description: "Check bot response time",
  handler: async (_sock, msg) => {
    const start = Date.now();
    await msg.reply("🏓 Testing...");
    const latency = Date.now() - start;
    await msg.reply(`⚡ *Speed Test*\n\nResponse: ${latency}ms`);
  },
});
