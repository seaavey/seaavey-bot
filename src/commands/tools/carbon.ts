import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "carbon",
  description: "Buat screenshot kode aesthetic. Contoh: .carbon console.log('hello')",
  handler: async (_sock, msg) => {
    const code = msg.args.join(" ");
    if (!code) return msg.reply("Format: .carbon <kode>\nContoh: .carbon console.log('hello')");
    const url = `https://carbonara.solopov.dev/api/cook?code=${encodeURIComponent(code)}&theme=monokai&language=auto`;
    const res = await fetch(url);
    if (!res.ok) return msg.reply("❌ Gagal membuat carbon.");
    const buffer = Buffer.from(await res.arrayBuffer());
    await msg.send({ image: buffer, caption: "💻 Carbon" });
  },
});
