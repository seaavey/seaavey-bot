import { defineCommand } from "@/core/types";
import { safeFetchJSON } from "@/utils/helper";

interface NpmPackage {
  name: string;
  description: string;
  "dist-tags": { latest: string };
  license: string;
  homepage: string;
}

export default defineCommand({
  name: "NPM",
  alias: ["npm"],
  description: "NPM package info. Example: .npm express",
  handler: async (_sock, msg) => {
    const pkg = msg.args[0];
    if (!pkg) return msg.reply("Format: .npm <package>");
    const data = await safeFetchJSON<NpmPackage>(
      `https://registry.npmjs.org/${encodeURIComponent(pkg)}`,
    );
    if (!data) return msg.reply("🚩 Package not found.");
    await msg.reply(
      `📦 *${data.name}*

📝 ${data.description || "-"}
🏷️ Version: ${data["dist-tags"]?.latest || "?"}
⚖️ License: ${data.license || "?"}`,
    );
  },
});
