import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "@/core/config";
import { defineCommand } from "@/core/types";

const FILE_PATH = join(import.meta.dir, "..", "..", "assets", "toxic.txt");

export default defineCommand({
  name: "toxic",
  description: "Kelola database kata toxic",
  handler: async (_sock, msg) => {
    const action = msg.args[0];
    const word = msg.args.slice(1).join(" ").toLowerCase();

    if (action === "add") {
      if (!word) return msg.reply("❓ Masukkan kata!");

      const current = readFileSync(FILE_PATH, "utf-8")
        .split("\n")
        .map((v) => v.trim());
      if (current.includes(word)) return msg.reply("✅ Sudah ada!");

      appendFileSync(FILE_PATH, `\n${word}`);

      // Hot-reload regex in memory
      const updated = readFileSync(FILE_PATH, "utf-8")
        .split("\n")
        .filter((w) => w.trim())
        .map((w) => w.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");
      config.toxicRegex = new RegExp(`\\b(?:${updated})\\b`, "i");

      await msg.reply(`✅ Berhasil tambah: *${word}*`);
    } else if (action === "del") {
      if (!word) return msg.reply("❓ Masukkan kata!");

      const current = readFileSync(FILE_PATH, "utf-8")
        .split("\n")
        .map((v) => v.trim());
      if (!current.includes(word)) return msg.reply("❌ Tidak ditemukan!");

      const filtered = current.filter((v) => v !== word).join("\n");
      writeFileSync(FILE_PATH, filtered);

      // Hot-reload regex
      const updated = filtered
        .split("\n")
        .filter((w) => w.trim())
        .map((w) => w.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");
      config.toxicRegex = new RegExp(`\\b(?:${updated})\\b`, "i");

      await msg.reply(`✅ Berhasil hapus: *${word}*`);
    } else if (action === "list") {
      const list = readFileSync(FILE_PATH, "utf-8").trim();
      await msg.reply(`📑 *Toxic List:*\n\n${list}`);
    } else {
      await msg.reply(
        `Usage:\n${config.prefix}toxic add [kata]\n${config.prefix}toxic del [kata]\n${config.prefix}toxic list`,
      );
    }
  },
});
