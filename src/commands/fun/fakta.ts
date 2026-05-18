import { getRandomItem } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const fakta = [
  "Gurita punya 3 jantung dan darahnya berwarna biru.",
  "Madu tidak pernah basi. Madu yang ditemukan di makam Mesir kuno masih bisa dimakan.",
  "Sidik jari koala hampir identik dengan sidik jari manusia.",
  "Pisang secara teknis adalah buah beri, tapi stroberi bukan.",
  "Jantung udang terletak di kepalanya.",
  "Satu hari di Venus lebih lama dari satu tahun di Venus.",
  "Manusia berbagi 60% DNA dengan pisang.",
  "Lumba-lumba tidur dengan satu mata terbuka.",
  "Lebah bisa mengenali wajah manusia.",
  "Otot terkuat di tubuh manusia adalah lidah.",
  "Kucing tidak bisa merasakan rasa manis.",
  "Astronot bertambah tinggi sekitar 5cm di luar angkasa.",
  "Otak manusia menggunakan 20% dari total energi tubuh.",
  "Ada lebih banyak bintang di alam semesta daripada butiran pasir di bumi.",
  "Kecoak bisa hidup tanpa kepala selama seminggu.",
];

export default defineCommand({
  name: "fakta",
  description: "Fakta random yang menarik",
  handler: async (_sock, msg) => {
    const f = getRandomItem(fakta);
    await msg.reply(`💡 *Tahukah Kamu?*\n\n${f}`);
  },
});
