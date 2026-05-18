import { getGroup, setGroup } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "goodbye",
  description: "Toggle goodbye message on/off",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya bisa digunakan di group.");
    if (!msg.isAdmin) return msg.reply("❌ Hanya admin yang bisa menggunakan command ini.");

    const group = getGroup(msg.jid);
    const newVal = group.goodbye ? 0 : 1;
    setGroup(msg.jid, "goodbye", newVal);
    await msg.reply(`✅ Goodbye ${newVal ? "diaktifkan" : "dinonaktifkan"}.`);
  },
});
