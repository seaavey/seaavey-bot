import { defineCommand } from "@/core/types";
import { safeFetchJSON } from "@/utils/helper";

interface Gempa {
  Tanggal: string;
  Jam: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi: string;
  Shakemap: string;
}

export default defineCommand({
  name: "Gempa",
  alias: ["gempa"],
  description: "Latest earthquake info from BMKG",
  handler: async (_sock, msg) => {
    await msg.reply("⏳ Fetching earthquake info...");
    const data = await safeFetchJSON<{ Infogempa?: { gempa?: Gempa } }>(
      "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
    );
    const g = data?.Infogempa?.gempa;
    if (!g) return msg.reply("🚩 Earthquake data is not available.");
    const caption = `🌍 *Latest Earthquake Info*

📅 ${g.Tanggal} ${g.Jam}
📏 Magnitude: ${g.Magnitude}
📐 Depth: ${g.Kedalaman}
📍 Region: ${g.Wilayah}
⚠️ Potential: ${g.Potensi}`;
    await msg.send({
      image: { url: `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}` },
      caption,
    });
  },
});
