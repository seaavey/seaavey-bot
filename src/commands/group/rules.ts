import { getGroup, setGroup } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "rules",
  description: "Lihat/set aturan grup. .rules set <teks> untuk mengatur.",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya untuk group.");
    const sub = msg.args[0]?.toLowerCase();

    if (sub === "set") {
      if (!msg.isAdmin) return msg.reply("❌ Khusus admin.");
      const text = msg.args.slice(1).join(" ");
      if (!text) return msg.reply("Format: .rules set <aturan grup>");
      setGroup(msg.jid, "welcomeMsg", text);
      return msg.reply("✅ Rules berhasil disimpan!");
    }

    const group = getGroup(msg.jid);
    const rules = group.welcomeMsg;
    if (!rules) return msg.reply("❌ Belum ada rules. Admin bisa set dengan: .rules set <teks>");
    await msg.reply(`📜 *Rules Grup*\n\n${rules}`);
  },
});
