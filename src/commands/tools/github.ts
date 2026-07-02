import { defineCommand } from "@/core/types";
import { safeFetchJSON } from "@/utils/helper";

interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  avatar_url: string;
  html_url: string;
}

export default defineCommand({
  name: "GitHub",
  alias: ["gh", "github"],
  description: "GitHub profile info. Example: .github seaavey",
  handler: async (_sock, msg) => {
    const username = msg.args[0];
    if (!username) return msg.reply("Format: .github <username>");
    await msg.reply("⏳ Fetching GitHub data...");
    const u = await safeFetchJSON<GitHubUser>(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
    );
    if (!u) return msg.reply("🚩 User not found.");
    await msg.send({
      image: { url: u.avatar_url },
      caption: `👤 *${u.login}* (${u.name || "-"})

📝 ${u.bio || "-"}
📦 Repos: ${u.public_repos}
👥 Followers: ${u.followers} • Following: ${u.following}
🔗 ${u.html_url}`,
    });
  },
});
