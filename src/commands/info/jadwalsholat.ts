import { defineCommand } from "@/core/types";
import { safeFetchJSON } from "@/utils/helper";

export default defineCommand({
  name: "Jadwal Sholat",
  alias: ["sholat", "jadwal", "jadwalsholat"],
  description: "Today's prayer schedule. Example: .jadwalsholat Jakarta",
  handler: async (_sock, msg) => {
    const city = msg.args.join(" ");
    if (!city) return msg.reply("Format: .jadwalsholat <kota>");
    await msg.reply("⏳ Fetching prayer schedule...");
    const today = new Date();
    const date = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;
    const data = await safeFetchJSON<{
      data?: { timings?: Record<string, string> };
    }>(
      `https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(city)}&country=Indonesia&method=20`,
    );
    const timings = data?.data?.timings;
    if (!timings) return msg.reply("🚩 City not found.");
    await msg.reply(
      `🕌 *Prayer Schedule for ${city} (${date})*

• Fajr: ${timings.Fajr}
• Sunrise: ${timings.Sunrise}
• Dhuhr: ${timings.Dhuhr}
• Asr: ${timings.Asr}
• Maghrib: ${timings.Maghrib}
• Isha: ${timings.Isha}`,
    );
  },
});
