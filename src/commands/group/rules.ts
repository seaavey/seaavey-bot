import { defineCommand } from "@/core/types";
import { getGroup, setGroup } from "@/infra/database";

export default defineCommand({
  name: "Rules",
  alias: ["rules"],
  description: "View/set group rules. .rules set <text> to set.",
  groupOnly: true,
  handler: async (_sock, msg) => {
    const sub = msg.args[0]?.toLowerCase();

    if (sub === "set") {
      if (!msg.isAdmin) return msg.reply("🚩 Admin only.");
      const text = msg.args.slice(1).join(" ");
      if (!text) return msg.reply("Format: .rules set <group rules>");
      setGroup(msg.jid, "welcomeMsg", text);
      return msg.reply("✅ Rules saved successfully!");
    }

    const group = getGroup(msg.jid);
    const rules = group.welcomeMsg;
    if (!rules) return msg.reply("🚩 No rules yet. Admin can set with: .rules set <text>");
    await msg.reply(`📋 *Rules*

${rules}`);
  },
});
