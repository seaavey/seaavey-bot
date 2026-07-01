import { defineCommand } from "@/core/types";
import { getNumber } from "@/utils/helper";

const sessions = new Map<string, { title: string; members: Set<string>; creator: string }>();

export default defineCommand({
  name: "Absen",
  alias: ["absen"],
  description:
    "Create/close attendance session. .absen open <title> / .absen attend / .absen close",
  groupOnly: true,
  handler: async (_sock, msg) => {
    const sub = msg.args[0]?.toLowerCase();

    if (sub === "buka" || sub === "open") {
      if (!msg.isAdmin) return msg.reply("🚩 Admin only.");
      const title = msg.args.slice(1).join(" ") || "Attendance";
      sessions.set(msg.jid, { title, members: new Set(), creator: msg.sender });
      return msg.reply(`📋 *Attendance Opened!*

📝 ${title}

Type .absen hadir to attend.`);
    }

    if (sub === "hadir" || sub === "h") {
      const session = sessions.get(msg.jid);
      if (!session) return msg.reply("🚩 No active attendance session.");
      session.members.add(msg.sender);
      return msg.reply(`✅ @${getNumber(msg.sender)} present! (${session.members.size} people)`);
    }

    if (sub === "tutup" || sub === "close") {
      if (!msg.isAdmin) return msg.reply("🚩 Admin only.");
      const session = sessions.get(msg.jid);
      if (!session) return msg.reply("🚩 No active attendance session.");
      const list = [...session.members].map((m, i) => `${i + 1}. @${getNumber(m)}`).join("\n");
      sessions.delete(msg.jid);
      return msg.send({
        text: `📋 *Attendance Closed!*

📝 ${session.title}
👥 Total: ${session.members.size} people

${list}`,
        mentions: [...session.members],
      });
    }

    await msg.reply("Format:\n.absen open <title>\n.absen attend\n.absen close");
  },
});
