import { getGroup, setGroup } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "antidelete",
  description: "Toggle antidelete on/off",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya bisa digunakan di group.");
    if (!msg.isAdmin) return msg.reply("❌ Hanya admin yang bisa menggunakan command ini.");

    const group = getGroup(msg.jid);
    const newVal = group.antidelete ? 0 : 1;
    setGroup(msg.jid, "antidelete", newVal);
    await msg.reply(`✅ Antidelete ${newVal ? "diaktifkan" : "dinonaktifkan"}.`);
  },
});
