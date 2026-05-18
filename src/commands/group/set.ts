import { setGroup } from "@/infra/database";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "set",
  description: "Set group settings (welcomeMsg, goodbyeMsg, warnMax)",
  handler: async (_sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya bisa digunakan di group.");
    if (!msg.isAdmin) return msg.reply("❌ Hanya admin yang bisa menggunakan command ini.");

    const [key, ...rest] = msg.args;
    const value = rest.join(" ");

    if (!key || !value) {
      return msg.reply(
        "📝 Penggunaan:\n• !set welcomeMsg Selamat datang @user!\n• !set goodbyeMsg Sampai jumpa @user!\n• !set warnMax 5",
      );
    }

    const allowed = ["welcomeMsg", "goodbyeMsg", "warnMax"] as const;
    type AllowedKey = (typeof allowed)[number];
    if (!allowed.includes(key as AllowedKey)) {
      return msg.reply(`❌ Key tidak valid. Pilih: ${allowed.join(", ")}`);
    }

    const finalValue = key === "warnMax" ? Number(value) || 3 : value;
    setGroup(msg.jid, key as AllowedKey, finalValue);
    await msg.reply(`✅ ${key} berhasil diubah.`);
  },
});
