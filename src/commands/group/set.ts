import { defineCommand } from "@/core/types";
import { setGroup } from "@/infra/database";

export default defineCommand({
  name: "Set",
  alias: ["set"],
  description: "Set group settings (welcomeMsg, goodbyeMsg, warnMax)",
  groupOnly: true,
  adminOnly: true,
  handler: async (_sock, msg) => {
    const [key, ...rest] = msg.args;
    const value = rest.join(" ");

    if (!key || !value) {
      return msg.reply(
        "📝 Usage:\n• !set welcomeMsg Welcome @user!\n• !set goodbyeMsg Goodbye @user!\n• !set warnMax 5",
      );
    }

    const allowed = ["welcomeMsg", "goodbyeMsg", "warnMax"] as const;
    type AllowedKey = (typeof allowed)[number];
    if (!allowed.includes(key as AllowedKey)) {
      return msg.reply(`🚩 Invalid key. Choose: ${allowed.join(", ")}`);
    }

    const finalValue = key === "warnMax" ? Number(value) || 3 : value;
    setGroup(msg.jid, key as AllowedKey, finalValue);
    await msg.reply(`✅ ${key} has been updated.`);
  },
});
