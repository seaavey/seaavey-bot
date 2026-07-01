import { defineCommand } from "@/core/types";
import { safeFetchJSON } from "@/utils/helper";

export default defineCommand({
  name: "Weather",
  alias: ["cuaca", "weather"],
  description: "Check weather for a city. Example: .weather Jakarta",
  handler: async (_sock, msg) => {
    const city = msg.args.join(" ");
    if (!city) return msg.reply("Format: .weather <city>");
    await msg.reply("⏳ Checking weather...");
    const data = await safeFetchJSON<{
      current_condition?: Array<{
        temp_C: string;
        weatherDesc: Array<{ value: string }>;
        humidity: string;
        windspeedKmph: string;
      }>;
      nearest_area?: Array<{
        areaName: Array<{ value: string }>;
        country: Array<{ value: string }>;
      }>;
    }>(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    if (!data) return msg.reply("🚩 City not found.");
    const cur = data.current_condition?.[0];
    const area = data.nearest_area?.[0];
    if (!cur) return msg.reply("🚩 Weather data is not available.");
    await msg.reply(
      `🌤️ *Weather ${area?.areaName[0]?.value || city}, ${area?.country[0]?.value || ""}*

🌡️ Temperature: ${cur.temp_C}°C
💧 Humidity: ${cur.humidity}%
💨 Wind: ${cur.windspeedKmph} km/h
📖 Description: ${cur.weatherDesc[0]?.value}`,
    );
  },
});
