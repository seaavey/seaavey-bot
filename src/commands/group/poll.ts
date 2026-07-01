import { defineCommand } from "@/core/types";
import { type Button, sendInteractive } from "@/handlers/interactive";
import {
  closePoll,
  createPoll,
  getPoll,
  getPollOptions,
  getPollVotes,
  votePoll,
} from "@/infra/database";

export default defineCommand({
  name: "Poll",
  alias: ["poll"],
  description: "Create/vote/close poll. Format: .poll Question? | Option1 | Option2",
  groupOnly: true,
  handler: async (sock, msg) => {
    const sub = msg.args[0];

    // Vote: .poll vote 1
    if (sub === "vote") {
      const poll = getPoll(msg.jid);
      if (!poll) return msg.reply("🚩 No active poll.");
      const votes = getPollVotes(poll);
      if (votes[msg.sender] !== undefined) return msg.reply("🚩 You have already voted!");
      const idx = parseInt(msg.args[1] || "0", 10) - 1;
      const options = getPollOptions(poll);
      if (Number.isNaN(idx) || idx < 0 || idx >= options.length)
        return msg.reply(`🚩 Choose 1-${options.length}`);
      votePoll(poll.id, msg.sender, idx);
      return msg.reply(`✅ Your vote: ${options[idx]!}`);
    }

    // Close: .poll close
    if (sub === "close") {
      if (!msg.isAdmin) return msg.reply("🚩 Admin only.");
      const poll = getPoll(msg.jid);
      if (!poll) return msg.reply("🚩 No active poll.");
      closePoll(poll.id);
      const options = getPollOptions(poll);
      const votes = getPollVotes(poll);
      const counts = options.map((_, i) => Object.values(votes).filter((v) => v === i).length);
      const result = options.map((o, i) => `${i + 1}. ${o} — ${counts[i]} vote`).join("\n");
      return msg.reply(`📊 *Poll Result*

${poll.question}

${result}`);
    }

    // Result: .poll result
    if (sub === "result") {
      const poll = getPoll(msg.jid);
      if (!poll) return msg.reply("🚩 No active poll.");
      const options = getPollOptions(poll);
      const buttons: Button[] = options.map((o: string, i: number) => ({
        name: "quick_reply",
        params: {
          display_text: o.slice(0, 20),
          id: `.poll vote ${i + 1}`,
        },
      }));

      return sendInteractive(sock, msg.jid, {
        body: `📊 *Active Poll*

${poll.question}`,
        footer: "Click the button below to vote",
        buttons,
      });
    }

    // Create: .poll Question? | Option1 | Option2
    const text = msg.args.join(" ");
    const parts = text.split("|").map((s: string) => s.trim());
    if (parts.length < 3)
      return msg.reply(
        "Format: .poll Question? | Option1 | Option2 | ...\n\nOthers:\n.poll vote <number>\n.poll result\n.poll close",
      );

    const [question, ...options] = parts;
    const existing = getPoll(msg.jid);
    if (existing)
      return msg.reply("🚩 There's already an active poll. Close it with .poll close first");
    createPoll(msg.jid, msg.sender, question as string, options);

    const buttons: Button[] = options.map((o: string, i: number) => ({
      name: "quick_reply",
      params: {
        display_text: o.slice(0, 20),
        id: `.poll vote ${i + 1}`,
      },
    }));

    await sendInteractive(sock, msg.jid, {
      body: `📊 *Poll Created!*

${question!}`,
      footer: "Click the button below to vote",
      buttons,
    });
  },
});
