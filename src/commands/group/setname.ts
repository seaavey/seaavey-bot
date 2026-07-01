import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Set Name",
  command: "gsetname",
  description: "Change group name",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  handler: async (sock, msg) => {
    const name = msg.args.join(" ");
    if (!name) return msg.reply("Enter a new name! Example: !setname Cool Group");
    await sock.groupUpdateSubject(msg.jid, name);
    await msg.reply(`Group name changed to: ${name}`);
  },
});
