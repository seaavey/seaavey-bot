import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Leave",
  command: "gleave",
  description: "Bot leaves the group",
  groupOnly: true,
  ownerOnly: true,
  handler: async (sock, msg) => {
    await msg.reply("Bye bye 👋");
    await sock.groupLeave(msg.jid);
  },
});
