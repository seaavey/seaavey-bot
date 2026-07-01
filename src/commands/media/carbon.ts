import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Carbon",
  alias: ["crb", "carbon"],
  description: "Create aesthetic code screenshot. Example: .carbon console.log('hello')",
  handler: async (_sock, msg) => {
    const code = msg.args.join(" ");
    if (!code) return msg.reply("Format: .carbon <kode>");
    await msg.reply("⏳ Creating carbon...");
    const url = `https://carbonara.solopov.dev/api/cook?code=${encodeURIComponent(code)}&theme=monokai&language=auto`;
    const res = await fetch(url);
    if (!res.ok) return msg.reply("🚩 Failed to create carbon image.");
    const buffer = Buffer.from(await res.arrayBuffer());
    await msg.send({ image: buffer, caption: "💻 Carbon" });
  },
});
