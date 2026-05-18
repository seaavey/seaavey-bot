import { getGroup } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "antiviewonce",
  description: "Toggle anti-viewonce on/off. Pesan view once akan di-forward ulang.",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya bisa digunakan di group.");
    if (!msg.isAdmin) return msg.reply("❌ Hanya admin yang bisa menggunakan command ini.");

    const group = getGroup(msg.jid);
    const newVal = group.antiviewonce ? 0 : 1;
    const { setGroup } = await import("@/infra/database");
    setGroup(msg.jid, "antiviewonce", newVal);
    await msg.reply(`✅ Anti-ViewOnce ${newVal ? "diaktifkan" : "dinonaktifkan"}.`);
  },
});
