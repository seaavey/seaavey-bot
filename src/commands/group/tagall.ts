import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "tagall",
  description: "Tag semua member grup",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("Hanya bisa di grup!");
    if (!msg.isAdmin) return msg.reply("Kamu bukan admin!");
    const metadata = await sock.groupMetadata(msg.jid);
    const mentions = metadata.participants.map((p) => p.id);
    const text = mentions.map((id) => `@${id.split("@")[0]}`).join("\n");
    await sock.sendMessage(msg.jid, { text, mentions });
  },
});
