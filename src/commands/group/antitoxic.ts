import { addToxicWord, getGroup, getToxicWords, removeToxicWord, setGroup } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "antitoxic",
  description: "Kelola antitoxic & word filter. Sub: on/off, add, del, list",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya bisa digunakan di group.");
    if (!msg.isAdmin) return msg.reply("❌ Hanya admin yang bisa menggunakan command ini.");

    const sub = msg.args[0]?.toLowerCase();

    if (!sub || sub === "on" || sub === "off") {
      const group = getGroup(msg.jid);
      const newVal = sub === "on" ? 1 : sub === "off" ? 0 : group.antitoxic ? 0 : 1;
      setGroup(msg.jid, "antitoxic", newVal);
      return msg.reply(`✅ Antitoxic ${newVal ? "diaktifkan" : "dinonaktifkan"}.`);
    }

    if (sub === "add") {
      const word = msg.args.slice(1).join(" ").trim();
      if (!word) return msg.reply("Format: .antitoxic add <kata>\nContoh: .antitoxic add anjing");
      addToxicWord(msg.jid, word);
      await msg.reply(`✅ Kata "${word}" ditambahkan ke filter toxic.`);
    } else if (sub === "del") {
      const word = msg.args.slice(1).join(" ").trim();
      if (!word) return msg.reply("Format: .antitoxic del <kata>");
      const removed = removeToxicWord(msg.jid, word);
      await msg.reply(
        removed ? `✅ Kata "${word}" dihapus dari filter.` : "❌ Kata tidak ditemukan.",
      );
    } else if (sub === "list") {
      const words = getToxicWords(msg.jid);
      if (!words.length)
        return msg.reply(
          "📭 Belum ada kata toxic di grup ini.\nTambah dengan: .antitoxic add <kata>",
        );
      const list = words.map((w, i) => `${i + 1}. ${w.word}`).join("\n");
      await msg.reply(`🚫 *Toxic Word Filter*\n\n${list}`);
    } else {
      await msg.reply(
        "📖 *Antitoxic Commands*\n\n" +
          ".antitoxic on/off — Toggle fitur\n" +
          ".antitoxic add <kata> — Tambah kata toxic\n" +
          ".antitoxic del <kata> — Hapus kata toxic\n" +
          ".antitoxic list — Lihat daftar kata",
      );
    }
  },
});
