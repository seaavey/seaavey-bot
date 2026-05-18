import { removeWarns } from "@/infra/database";
import { getNumber } from "@/utils/helper";
import { defineCommand } from "@/core/types";
export default defineCommand({
  name: "unwarn",
  description: "Hapus semua warn member",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya untuk group.");
    if (!msg.isAdmin) return msg.reply("❌ Khusus admin.");
    const target = msg.mentioned[0] || msg.quoted;
    if (!target) return msg.reply("Tag atau reply user yang ingin diunwarn.");
    removeWarns(msg.jid, target);
    await msg.reply(`✅ Semua warn @${getNumber(target)} telah dihapus.`);
  },
});
