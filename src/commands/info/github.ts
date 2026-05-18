import { defineCommand } from "@/core/types";

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
  name: "github",
  description: "Info profil GitHub. Contoh: .github seaavey",
  handler: async (_sock, msg) => {
    const username = msg.args[0];
    if (!username) return msg.reply("Format: .github <username>");
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
    if (!res.ok) return msg.reply("❌ User tidak ditemukan.");
    const u = (await res.json()) as GitHubUser;
    await msg.send({
      image: { url: u.avatar_url },
      caption: `🐙 *GitHub — ${u.login}*\n\n👤 ${u.name || "-"}\n📝 ${u.bio || "-"}\n📦 Repos: ${u.public_repos}\n👥 Followers: ${u.followers} | Following: ${u.following}\n🔗 ${u.html_url}`,
    });
  },
});
