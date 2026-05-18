import { getRandomItem } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const truths = [
  "Siapa orang yang paling sering kamu stalking di sosmed?",
  "Apa rahasia terbesar yang belum pernah kamu ceritakan ke siapapun?",
  "Siapa crush kamu saat ini?",
  "Hal paling memalukan yang pernah kamu lakukan?",
  "Pernah bohong ke orang tua soal apa?",
  "Siapa di grup ini yang paling kamu suka?",
  "Apa kebiasaan aneh kamu yang gak ada yang tau?",
  "Pernah nangis gara-gara film/anime apa?",
  "Hal apa yang bikin kamu insecure?",
  "Siapa mantan yang masih kamu kangen?",
];

const dares = [
  "Kirim voice note nyanyi lagu anak-anak!",
  "Ganti foto profil jadi meme selama 1 jam!",
  "Kirim chat 'aku kangen kamu' ke kontak terakhir!",
  "Voice note teriak 'AKU GANTENG/CANTIK' sekeras mungkin!",
  "Kirim stiker paling cringe yang kamu punya!",
  "Reply story orang random dengan 'hai cantik/ganteng'!",
  "Tulis bio WA 'aku jomblo butuh kasih sayang' selama 1 jam!",
  "Kirim foto selfie tanpa filter sekarang!",
  "Voice note ketawa selama 10 detik!",
  "Tag admin dan bilang 'kamu ganteng/cantik banget'!",
];

export default defineCommand({
  name: "tod",
  description: "Truth or Dare random",
  handler: async (_sock, msg) => {
    const type = msg.args[0]?.toLowerCase();
    if (type === "truth" || type === "t") {
      const q = getRandomItem(truths);
      return msg.reply(`🤔 *Truth:*\n\n${q}`);
    }
    if (type === "dare" || type === "d") {
      const q = getRandomItem(dares);
      return msg.reply(`🔥 *Dare:*\n\n${q}`);
    }
    const isTruth = Math.random() > 0.5;
    const pool = isTruth ? truths : dares;
    const q = getRandomItem(pool);
    await msg.reply(
      `${isTruth ? "🤔 *Truth:*" : "🔥 *Dare:*"}\n\n${q}\n\n_Pilih: .tod truth / .tod dare_`,
    );
  },
});
