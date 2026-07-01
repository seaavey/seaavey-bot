import type { WASocket } from "baileys";
import { defineCommand } from "@/core/types";
import * as userRepo from "@/infra/repositories/user-repo";
import { logger } from "@/core/logger";
import {
  akinatorStart,
  akinatorAnswer,
  akinatorExclude,
  type AkinatorSession,
  type AkinatorGuess,
} from "@/infra/scrapers/akinator";

interface AkinatorSessionState {
  session: AkinatorSession;
  lastActive: number;
  timeout: ReturnType<typeof setTimeout>;
  stage: "question" | "guess_confirmation";
  currentGuess?: AkinatorGuess;
  isProcessing?: boolean;
  sock: WASocket;
}

const sessions = new Map<string, AkinatorSessionState>();

async function translateToId(text: string): Promise<string> {
  return text;
}

export default defineCommand({
  name: "Akinator",
  alias: ["aki"],
  description: "Play Akinator game",
  handler: async (sock, msg) => {
    const key = `${msg.jid}:${msg.sender}`;
    if (sessions.has(key)) {
      return msg.reply(
        "🚩 Akinator session already active! You must finish or stop it by typing *stop* or *quit*.",
      );
    }

    await msg.reply("⏳ Starting Akinator...");

    const startRes = await akinatorStart();
    if (!startRes.status) {
      return msg.reply(`🚩 Failed to start Akinator game: ${startRes.error || "Unknown error"}`);
    }

    const session = startRes.data;
    const guess = (session as { guess?: AkinatorGuess }).guess;

    const state: AkinatorSessionState = {
      session,
      lastActive: Date.now(),
      stage: guess ? "guess_confirmation" : "question",
      sock,
      timeout: setTimeout(() => {}, 0),
    };
    if (guess) {
      state.currentGuess = guess;
    }

    state.timeout = setTimeout(() => {
      sessions.delete(key);
      sock.sendMessage(msg.jid, {
        text: "⏰ Akinator session has ended due to inactivity.",
      });
    }, 120_000);

    sessions.set(key, state);

    if (guess) {
      const translatedName = await translateToId(guess.name);
      const translatedDesc = await translateToId(guess.description);
      const photoText = guess.photo ? `\n\n🖼️ Photo: ${guess.photo}` : "";
      await msg.reply(
        `💡 I'm guessing...
👤 *${translatedName}* (${translatedDesc || "No description"})${photoText}

Is this correct? (yes/no)`,
      );
    } else {
      const translatedQuestion = await translateToId(session.question);
      await msg.reply(
        `💡 *Akinator* - Step ${session.step + 1}
📈 Progress: ${session.progression}%

❓ *${translatedQuestion}*

0. Yes
1. No
2. Don't know
3. Probably
4. Probably not`,
      );
    }
  },
});

export async function checkAkinator(
  jid: string,
  text: string,
  sender: string,
): Promise<string | null> {
  const key = `${jid}:${sender}`;
  const state = sessions.get(key);
  if (!state) return null;

  const inputLower = text.toLowerCase().trim();

  if (["exit", "stop", "batal", "cancel", "nyerah", "keluar"].includes(inputLower)) {
    clearTimeout(state.timeout);
    sessions.delete(key);
    return "🚩 Game stopped. Akinator session has been ended.";
  }

  if (state.isProcessing) return null;

  if (state.stage === "question") {
    let option: number | null = null;
    if (["0", "yes", "ya", "y"].includes(inputLower)) {
      option = 0;
    } else if (["1", "no", "tidak", "n", "t", "tdk"].includes(inputLower)) {
      option = 1;
    } else if (
      ["2", "i don't know", "tidak tahu", "dont know", "gatau", "ga tau", "tahu"].includes(
        inputLower,
      )
    ) {
      option = 2;
    } else if (["3", "probably", "mungkin", "mngkin"].includes(inputLower)) {
      option = 3;
    } else if (
      ["4", "probably not", "mungkin tidak", "mngkin tdk", "kayaknya gak"].includes(inputLower)
    ) {
      option = 4;
    }

    if (option === null) {
      return "🚩 Invalid option! Please answer with 0 (Yes), 1 (No), 2 (Don't know), 3 (Probably), or 4 (Probably not).";
    }

    state.isProcessing = true;
    try {
      // Reset inactivity timer
      clearTimeout(state.timeout);
      state.timeout = setTimeout(() => {
        sessions.delete(key);
        state.sock.sendMessage(jid, {
          text: "⏰ Akinator session has ended due to inactivity.",
        });
      }, 120_000);
      state.lastActive = Date.now();

      const res = await akinatorAnswer(state.session, option);
      if (!res.status) {
        return `🚩 Failed to process game: ${res.error || "Unknown error"}`;
      }

      if (res.data.guess) {
        const guess = res.data.guess;
        state.stage = "guess_confirmation";
        state.currentGuess = guess;
        const translatedName = await translateToId(guess.name);
        const translatedDesc = await translateToId(guess.description);
        const photoText = guess.photo ? `\n\n🖼️ Photo: ${guess.photo}` : "";
        return `💡 I'm guessing...
👤 *${translatedName}* (${translatedDesc || "No description"})${photoText}

Is this correct? (yes/no)`;
      } else if (res.data.session) {
        const nextSession = res.data.session;
        state.session = nextSession;
        const translatedQuestion = await translateToId(nextSession.question);
        return `💡 *Akinator* - Step ${nextSession.step + 1}
📈 Progress: ${nextSession.progression}%

❓ *${translatedQuestion}*

0. Yes
1. No
2. Don't know
3. Probably
4. Probably not`;
      } else {
        return "🚩 Failed to process game: Invalid API response";
      }
    } catch (err: unknown) {
      const errStr = String(err);
      if (errStr.includes("No more questions")) {
        clearTimeout(state.timeout);
        sessions.delete(key);
        return "🚩 Game ended: No more questions.";
      }
      logger.error(err, "Akinator answer error");
      return "🚩 Failed to process game: Connection to server lost, try again later";
    } finally {
      state.isProcessing = false;
    }
  } else if (state.stage === "guess_confirmation") {
    let confirmed: boolean | null = null;
    if (["yes", "ya", "y", "benar", "betul"].includes(inputLower)) {
      confirmed = true;
    } else if (["no", "tidak", "n", "t", "salah", "tdk"].includes(inputLower)) {
      confirmed = false;
    }

    if (confirmed === null) {
      return `🚩 Invalid confirmation! Is this character *${state.currentGuess?.name ?? "my guess"}*? Please reply with Yes or No.`;
    }

    if (confirmed) {
      clearTimeout(state.timeout);
      sessions.delete(key);
      try {
        userRepo.addXp(sender, 105);
      } catch (err) {
        logger.error(err, "Failed to add XP to user in Akinator");
      }
      return "🎉 *Yay!* I guessed correctly! Thanks for playing! (+105 XP)";
    } else {
      state.isProcessing = true;
      try {
        const res = await akinatorExclude(state.session);
        if (!res.status) {
          if (res.error && res.error.includes("No more questions")) {
            clearTimeout(state.timeout);
            sessions.delete(key);
            return "🚩 Game ended: No more questions.";
          }
          return `🚩 Failed to exclude character: ${res.error || "Unknown error"} (Current guess: ${state.currentGuess?.name ?? ""})`;
        }

        const nextSession = res.data;
        state.stage = "question";
        state.session = nextSession;

        // Reset inactivity timer
        clearTimeout(state.timeout);
        state.timeout = setTimeout(() => {
          sessions.delete(key);
          state.sock.sendMessage(jid, {
            text: "⏰ Akinator session has ended due to inactivity.",
          });
        }, 120_000);
        state.lastActive = Date.now();

        const translatedQuestion = await translateToId(nextSession.question);
        return `💡 *Akinator* - Step ${nextSession.step + 1}
📈 Progress: ${nextSession.progression}%

❓ *${translatedQuestion}*

0. Yes
1. No
2. Don't know
3. Probably
4. Probably not`;
      } catch (err: unknown) {
        const errStr = String(err);
        if (errStr.includes("No more questions")) {
          clearTimeout(state.timeout);
          sessions.delete(key);
          return "🚩 Game ended: No more questions.";
        }
        logger.error(err, "Akinator exclude error");
        return `🚩 Failed to exclude character: Connection lost (Current guess: ${state.currentGuess?.name ?? ""})`;
      } finally {
        state.isProcessing = false;
      }
    }
  }

  return null;
}
