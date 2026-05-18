import { config } from "@/core/config";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "owner",
  description: "Info owner bot",
  handler: async (sock, msg) => {
    await sock.sendMessage(msg.jid, {
      contacts: {
        contacts: config.owner.map((num, i) => ({
          displayName: `Owner ${i + 1}`,
          vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Owner ${config.name}\nTEL;type=CELL:+${num}\nEND:VCARD`,
        })),
      },
    });
  },
});
