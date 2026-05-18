import { defineCommand } from "@/core/types";

interface NpmPackage {
  name: string;
  description: string;
  "dist-tags": { latest: string };
  license: string;
  homepage: string;
}

export default defineCommand({
  name: "npm",
  description: "Info package NPM. Contoh: .npm express",
  handler: async (_sock, msg) => {
    const pkg = msg.args[0];
    if (!pkg) return msg.reply("Format: .npm <package>");
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`);
    if (!res.ok) return msg.reply("❌ Package tidak ditemukan.");
    const data = (await res.json()) as NpmPackage;
    await msg.reply(
      `📦 *NPM — ${data.name}*\n\n📝 ${data.description || "-"}\n🏷️ Latest: ${data["dist-tags"]?.latest || "?"}\n📄 License: ${data.license || "?"}\n🔗 https://npmjs.com/package/${data.name}`,
    );
  },
});
