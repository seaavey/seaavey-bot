import { defineCommand } from "@/core/types";
import { getNumber, getRandomItem } from "@/utils/helper";

export default defineCommand({
  name: "Siapa YG",
  alias: ["spy", "siapayg"],
  description: "Select a group member randomly for a question",
  groupOnly: true,
  handler: async (sock, msg) => {
    const question = msg.args.join(" ");
    if (!question) return msg.reply("Format: .siapayg <question>");

    const metadata = await sock.groupMetadata(msg.jid);
    const members = metadata.participants.map((p) => p.id);
    const chosen = getRandomItem(members) as string;

    await msg.send({
      text: `🎯 *Who ${question}?*

The answer: @${getNumber(chosen)} 😂`,
      mentions: [chosen],
    });
  },
});
