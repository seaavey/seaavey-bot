import { getGroup, setGroup } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "antispam",
  description: "Toggle antispam on/off",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya bisa digunakan di group.");
    if (!msg.isAdmin) return msg.reply("❌ Hanya admin yang bisa menggunakan command ini.");

    const group = getGroup(msg.jid);
    const newVal = group.antispam ? 0 : 1;
    setGroup(msg.jid, "antispam", newVal);
    await msg.reply(`✅ Antispam ${newVal ? "diaktifkan" : "dinonaktifkan"}.`);
  },
});
