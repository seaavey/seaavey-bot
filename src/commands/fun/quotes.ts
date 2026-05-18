import { getRandomItem } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const quotes = [
  "Hidup itu seperti bersepeda. Agar tetap seimbang, kamu harus terus bergerak. — Albert Einstein",
  "Satu-satunya cara untuk melakukan pekerjaan hebat adalah mencintai apa yang kamu lakukan. — Steve Jobs",
  "Jangan menunggu. Waktunya tidak akan pernah tepat. — Napoleon Hill",
  "Kesuksesan adalah guru yang buruk. Ia membuat orang pintar berpikir mereka tidak bisa gagal. — Bill Gates",
  "Pendidikan adalah senjata paling ampuh untuk mengubah dunia. — Nelson Mandela",
  "Jadilah perubahan yang ingin kamu lihat di dunia. — Mahatma Gandhi",
  "Kegagalan adalah bumbu yang memberi rasa pada kesuksesan. — Truman Capote",
  "Mimpi tidak menjadi kenyataan melalui sihir. Butuh keringat, tekad, dan kerja keras. — Colin Powell",
  "Jangan takut gagal. Takutlah untuk tidak mencoba. — Michael Jordan",
  "Waktu terbaik untuk menanam pohon adalah 20 tahun lalu. Waktu terbaik kedua adalah sekarang. — Pepatah Cina",
  "Orang yang tidak pernah membuat kesalahan adalah orang yang tidak pernah mencoba sesuatu yang baru. — Albert Einstein",
  "Bukan seberapa keras kamu dipukul, tapi seberapa keras kamu bisa dipukul dan tetap maju. — Rocky Balboa",
];

export default defineCommand({
  name: "quotes",
  description: "Quotes motivasi random",
  handler: async (_sock, msg) => {
    const q = getRandomItem(quotes);
    await msg.reply(`💬 *Quote of the Day*\n\n_"${q}"_`);
  },
});
