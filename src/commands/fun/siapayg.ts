import { defineCommand } from "@/core/types";
import { getNumber, getRandomItem } from "@/utils/helper";
export default defineCommand({
  name: "siapayg",
  description: "Random pilih member grup. Contoh: .siapayg paling ganteng",
  handler: async (sock, msg) => {
    if (!msg.isGroup) return msg.reply("❌ Hanya untuk group.");
    const question = msg.args.join(" ");
    if (!question)
      return msg.reply(
        "Format: .siapayg <pertanyaan>\nContoh: .siapayg paling ganteng di grup ini",
      );
    const metadata = await sock.groupMetadata(msg.jid);
    const members = metadata.participants.map((p) => p.id);
    const chosen = getRandomItem(members) as string;
    await msg.send({
      text: `🎯 *Siapa yang ${question}?*\n\nJawabannya: @${getNumber(chosen)} 😂`,
      mentions: [chosen],
    });
  },
});
