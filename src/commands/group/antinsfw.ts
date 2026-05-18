import { getGroup, setGroup } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "antinsfw",
  description: "Toggle anti-NSFW di group",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya untuk group.");
    if (!msg.isAdmin) return msg.reply("❌ Khusus admin.");
    const group = getGroup(msg.jid);
    const newVal = group.antinsfw ? 0 : 1;
    setGroup(msg.jid, "antinsfw", newVal);
    await msg.reply(`🛡️ Anti-NSFW ${newVal ? "aktif ✅" : "nonaktif ❌"}`);
  },
});
