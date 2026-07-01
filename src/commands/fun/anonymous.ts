import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "Anonymous",
  alias: ["anon", "anonymous"],
  description: "Send an anonymous message to a group member. Format: .anonymous @tag message",
  groupOnly: true,
  handler: async (sock, msg) => {
    const mentioned = msg.mentioned[0];
    const text = msg.args.slice(1).join(" ");

    if (!mentioned || !text) {
      return msg.reply(
        "Format: .anonymous @tag message\nExample: .anonymous @6281xxx Hey you are cool!",
      );
    }

    if (mentioned === msg.sender) return msg.reply("🚩 Cannot send to yourself.");

    await sock.sendMessage(msg.jid, {
      text: `💬 *Anonymous Message*

"${text}"

_Someone in this group sent an anonymous message for you._`,
      mentions: [mentioned],
    });

    await msg.reply("✅ Anonymous message sent to the group!");
  },
});
