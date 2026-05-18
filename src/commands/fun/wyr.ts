import { getRandomItem } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const questions = [
  { a: "Bisa terbang tapi gak bisa berenang", b: "Bisa berenang tapi gak bisa jalan" },
  { a: "Kaya tapi gak punya teman", b: "Miskin tapi punya banyak teman" },
  { a: "Bisa baca pikiran orang", b: "Bisa melihat masa depan" },
  { a: "Hidup tanpa musik selamanya", b: "Hidup tanpa film/series selamanya" },
  { a: "Selalu jujur", b: "Selalu berbohong" },
  { a: "Jadi invisible", b: "Bisa teleportasi" },
  { a: "Gak bisa pakai HP selamanya", b: "Gak bisa makan makanan favorit selamanya" },
  { a: "Tinggal di gunung sendirian", b: "Tinggal di kota yang super ramai" },
  { a: "Punya waktu tapi gak punya uang", b: "Punya uang tapi gak punya waktu" },
  { a: "Bisa ngomong sama hewan", b: "Bisa ngomong semua bahasa di dunia" },
  { a: "Hidup di dunia Harry Potter", b: "Hidup di dunia Marvel" },
  { a: "Jadi orang paling pintar", b: "Jadi orang paling beruntung" },
];

export default defineCommand({
  name: "wyr",
  description: "Would You Rather — pilih salah satu!",
  handler: async (_sock, msg) => {
    const q = getRandomItem(questions) as (typeof questions)[number];
    await msg.reply(`🤔 *Would You Rather?*\n\n🅰️ ${q.a}\n\natau\n\n🅱️ ${q.b}\n\n_Pilih A atau B!_`);
  },
});
