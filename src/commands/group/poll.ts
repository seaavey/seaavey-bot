import { t } from "@/core/translations";
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
  description: t("group.poll.description"),
  groupOnly: true,
  handler: async (sock, msg) => {
    const sub = msg.args[0];

    // Vote: .poll vote 1
    if (sub === "vote") {
      const poll = getPoll(msg.jid);
      if (!poll) return msg.reply(t("group.poll.noPoll"));
      const votes = getPollVotes(poll);
      if (votes[msg.sender] !== undefined) return msg.reply(t("group.poll.alreadyVoted"));
      const idx = parseInt(msg.args[1] || "0", 10) - 1;
      const options = getPollOptions(poll);
      if (Number.isNaN(idx) || idx < 0 || idx >= options.length)
        return msg.reply(t("group.poll.invalidOption", { max: options.length }));
      votePoll(poll.id, msg.sender, idx);
      return msg.reply(t("group.poll.voted", { option: options[idx]! }));
    }

    // Close: .poll close
    if (sub === "close") {
      if (!msg.isAdmin) return msg.reply(t("group.poll.adminOnly"));
      const poll = getPoll(msg.jid);
      if (!poll) return msg.reply(t("group.poll.noPoll"));
      closePoll(poll.id);
      const options = getPollOptions(poll);
      const votes = getPollVotes(poll);
      const counts = options.map((_, i) => Object.values(votes).filter((v) => v === i).length);
      const result = options.map((o, i) => `${i + 1}. ${o} — ${counts[i]} vote`).join("\n");
      return msg.reply(t("group.poll.result", { question: poll.question, result }));
    }

    // Result: .poll result
    if (sub === "result") {
      const poll = getPoll(msg.jid);
      if (!poll) return msg.reply(t("group.poll.noPoll"));
      const options = getPollOptions(poll);
      const votes = getPollVotes(poll);
      const counts = options.map((_, i) => Object.values(votes).filter((v) => v === i).length);
      const result = options.map((o, i) => `${i + 1}. ${o} — ${counts[i]} vote`).join("\n");

      const buttons: Button[] = options.map((o: string, i: number) => ({
        name: "quick_reply",
        params: {
          display_text: o.slice(0, 20),
          id: `.poll vote ${i + 1}`,
        },
      }));

      return sendInteractive(sock, msg.jid, {
        body: t("group.poll.activePoll", { question: poll.question, result }),
        footer: t("group.poll.footer"),
        buttons,
      });
    }

    // Create: .poll Question? | Option1 | Option2
    const text = msg.args.join(" ");
    const parts = text.split("|").map((s: string) => s.trim());
    if (parts.length < 3) return msg.reply(t("group.poll.help"));

    const [question, ...options] = parts;
    const existing = getPoll(msg.jid);
    if (existing) return msg.reply(t("group.poll.alreadyExists"));
    createPoll(msg.jid, msg.sender, question as string, options);

    const buttons: Button[] = options.map((o: string, i: number) => ({
      name: "quick_reply",
      params: {
        display_text: o.slice(0, 20),
        id: `.poll vote ${i + 1}`,
      },
    }));

    await sendInteractive(sock, msg.jid, {
      body: t("group.poll.created", { question: question! }),
      footer: t("group.poll.footer"),
      buttons,
    });
  },
});
