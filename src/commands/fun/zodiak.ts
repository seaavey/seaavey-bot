import { getRandomItem } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const zodiak: Record<string, string[]> = {
  aries: [
    "Hari ini energimu tinggi! Cocok untuk memulai proyek baru.",
    "Jangan terlalu keras kepala hari ini.",
    "Ada kejutan dari seseorang yang kamu sayang.",
  ],
  taurus: [
    "Keuanganmu stabil hari ini. Jangan boros!",
    "Saatnya menikmati hal-hal kecil.",
    "Seseorang memperhatikanmu diam-diam.",
  ],
  gemini: [
    "Komunikasimu sedang bagus. Manfaatkan!",
    "Jangan terlalu overthinking.",
    "Ada kabar baik dari teman lama.",
  ],
  cancer: [
    "Luangkan waktu untuk keluarga hari ini.",
    "Perasaanmu sensitif, jaga emosi.",
    "Rezeki datang dari arah tak terduga.",
  ],
  leo: [
    "Kamu jadi pusat perhatian hari ini!",
    "Percaya diri boleh, sombong jangan.",
    "Ada peluang karir yang menarik.",
  ],
  virgo: [
    "Detail kecil bisa jadi kunci sukses hari ini.",
    "Jangan terlalu perfeksionis.",
    "Kesehatan perlu diperhatikan.",
  ],
  libra: [
    "Hari yang cocok untuk bersosialisasi.",
    "Keputusan penting menanti, pikirkan matang.",
    "Cinta sedang berpihak padamu.",
  ],
  scorpio: [
    "Intuisimu tajam hari ini, percayalah.",
    "Jangan menyimpan dendam.",
    "Ada misteri yang akan terungkap.",
  ],
  sagitarius: [
    "Petualangan menanti! Jangan takut mencoba.",
    "Optimismemu menular ke orang lain.",
    "Belajar hal baru akan membawa keberuntungan.",
  ],
  capricorn: [
    "Kerja kerasmu akan membuahkan hasil.",
    "Jangan lupa istirahat.",
    "Seseorang mengagumi dedikasimu.",
  ],
  aquarius: [
    "Ide kreatifmu sedang mengalir deras.",
    "Jangan takut berbeda.",
    "Teman baru akan membawa perspektif segar.",
  ],
  pisces: [
    "Imajinasimu tinggi hari ini. Tuangkan ke karya!",
    "Jangan terlalu melamun.",
    "Ada pesan penting dari mimpimu.",
  ],
};

export default defineCommand({
  name: "zodiak",
  description: "Ramalan zodiak. Contoh: .zodiak aries",
  handler: async (_sock, msg) => {
    const sign = msg.args[0]?.toLowerCase();
    if (!sign || !zodiak[sign]) {
      const list = Object.keys(zodiak).join(", ");
      return msg.reply(`Format: .zodiak <zodiak>\nPilihan: ${list}`);
    }
    const predictions = zodiak[sign];
    const pred = getRandomItem(predictions);
    await msg.reply(`🔮 *Zodiak ${sign.charAt(0).toUpperCase() + sign.slice(1)}*\n\n${pred}`);
  },
});
