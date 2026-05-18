import { defineCommand } from "@/core/types";

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
  name: "gempa",
  description: "Info gempa terkini dari BMKG",
  handler: async (_sock, msg) => {
    const res = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json");
    const data = (await res.json()) as { Infogempa?: { gempa?: Gempa } };
    const g = data.Infogempa?.gempa;
    if (!g) return msg.reply("❌ Data gempa tidak tersedia.");
    const caption = `🌍 *Info Gempa Terkini*\n\n📅 ${g.Tanggal} ${g.Jam}\n📏 Magnitudo: ${g.Magnitude}\n📐 Kedalaman: ${g.Kedalaman}\n📍 Wilayah: ${g.Wilayah}\n⚠️ Potensi: ${g.Potensi}`;
    await msg.send({
      image: { url: `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}` },
      caption,
    });
  },
});
