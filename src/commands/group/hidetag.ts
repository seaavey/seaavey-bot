import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "hidetag",
  description: "Tag semua member tanpa mention visible",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    if (!msg.isAdmin) return msg.reply("Kamu bukan admin!");
    const metadata = await sock.groupMetadata(msg.jid);
    const participants = metadata.participants.map((p) => p.id);
    const text = msg.args.join(" ") || "‎";
    await sock.sendMessage(msg.jid, { text, mentions: participants });
  },
});
