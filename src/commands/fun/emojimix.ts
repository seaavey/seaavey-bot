import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "emojimix",
  description: "Gabungkan 2 emoji. Contoh: .emojimix 😀+🔥",
  handler: async (_sock, msg) => {
    const text = msg.args.join(" ");
    const match = text.match(/(.+)\+(.+)/);
    if (!match) return msg.reply("Format: .emojimix <emoji1>+<emoji2>\nContoh: .emojimix 😀+🔥");
    const [, e1, e2] = match;
    const code1 = [...(e1?.trim() || "")].map((c) => c.codePointAt(0)?.toString(16)).join("-");
    const code2 = [...(e2?.trim() || "")].map((c) => c.codePointAt(0)?.toString(16)).join("-");
    const url = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${code1}/u${code1}_u${code2}.png`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("not found");
      await msg.send({ sticker: { url } });
    } catch {
      await msg.reply("❌ Kombinasi emoji ini tidak tersedia.");
    }
  },
});
