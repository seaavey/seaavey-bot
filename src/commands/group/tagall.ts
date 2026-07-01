import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Tag All",
  alias: ["tag", "tagall"],
  description: "Tag all group members",
  groupOnly: true,
  adminOnly: true,
  handler: async (sock, msg) => {
    const metadata = await sock.groupMetadata(msg.jid);
    const mentions = metadata.participants.map((p) => p.id);
    const text = mentions.map((id) => `@${id.split("@")[0]}`).join("\n");
    await sock.sendMessage(msg.jid, { text, mentions });
  },
});
