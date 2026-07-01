import type { WASocket } from "baileys";
import axios from "axios";
import { t } from "@/core/translations";
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
  if (!text) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(text)}`;
    const { data } = await axios.get(url);
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return (data[0] as unknown[])
        .map((x: unknown) => (x as string[])[0])
        .join("")
        .trim();
    }
    return text;
  } catch {
    return text;
  }
}

export default defineCommand({
  name: "Akinator",
  alias: ["aki"],
  description: t("game.akinator.desc"),
  handler: async (sock, msg) => {
    const key = `${msg.jid}:${msg.sender}`;
    if (sessions.has(key)) {
      return msg.reply(t("game.akinator.existing"));
    }

    await msg.reply(t("game.akinator.searching"));

    const startRes = await akinatorStart();
    if (!startRes.status) {
      return msg.reply(
        t("game.akinator.startError", { error: startRes.error || t("game.akinator.unknownError") }),
      );
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
        text: t("game.akinator.timeout"),
      });
    }, 120_000);

    sessions.set(key, state);

    if (guess) {
      const translatedName = await translateToId(guess.name);
      const translatedDesc = await translateToId(guess.description);
      const photoText = guess.photo ? `\n\n🖼️ Foto: ${guess.photo}` : "";
      await msg.reply(
        t("game.akinator.guess", {
          name: translatedName,
          desc: translatedDesc || t("game.akinator.noDesc"),
          photo: photoText,
        }),
      );
    } else {
      const translatedQuestion = await translateToId(session.question);
      await msg.reply(
        t("game.akinator.question", {
          step: session.step + 1,
          progression: session.progression,
          question: translatedQuestion,
        }),
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
    return t("game.akinator.cancelled");
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
      return t("game.akinator.invalidOption");
    }

    state.isProcessing = true;
    try {
      // Reset inactivity timer
      clearTimeout(state.timeout);
      state.timeout = setTimeout(() => {
        sessions.delete(key);
        state.sock.sendMessage(jid, {
          text: t("game.akinator.timeout"),
        });
      }, 120_000);
      state.lastActive = Date.now();

      const res = await akinatorAnswer(state.session, option);
      if (!res.status) {
        return t("game.akinator.processError", {
          error: res.error || t("game.akinator.unknownError"),
        });
      }

      if (res.data.guess) {
        const guess = res.data.guess;
        state.stage = "guess_confirmation";
        state.currentGuess = guess;
        const translatedName = await translateToId(guess.name);
        const translatedDesc = await translateToId(guess.description);
        const photoText = guess.photo ? `\n\n🖼️ Foto: ${guess.photo}` : "";
        return t("game.akinator.guess", {
          name: translatedName,
          desc: translatedDesc || t("game.akinator.noDesc"),
          photo: photoText,
        });
      } else if (res.data.session) {
        const nextSession = res.data.session;
        state.session = nextSession;
        const translatedQuestion = await translateToId(nextSession.question);
        return t("game.akinator.question", {
          step: nextSession.step + 1,
          progression: nextSession.progression,
          question: translatedQuestion,
        });
      } else {
        return t("game.akinator.invalidApiResponse");
      }
    } catch (err: unknown) {
      const errStr = String(err);
      if (errStr.includes("No more questions")) {
        clearTimeout(state.timeout);
        sessions.delete(key);
        return t("game.akinator.noMoreQuestions");
      }
      logger.error(err, "Akinator answer error");
      return t("game.akinator.connectionError");
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
      return t("game.akinator.invalidConfirmation", {
        name: state.currentGuess?.name ?? t("game.akinator.myGuess"),
      });
    }

    if (confirmed) {
      clearTimeout(state.timeout);
      sessions.delete(key);
      try {
        userRepo.addXp(sender, 105);
      } catch (err) {
        logger.error(err, "Failed to add XP to user in Akinator");
      }
      return t("game.akinator.win");
    } else {
      state.isProcessing = true;
      try {
        const res = await akinatorExclude(state.session);
        if (!res.status) {
          if (res.error && res.error.includes("No more questions")) {
            clearTimeout(state.timeout);
            sessions.delete(key);
            return t("game.akinator.noMoreQuestions");
          }
          return t("game.akinator.excludeError", {
            error: res.error || t("game.akinator.unknownError"),
            name: state.currentGuess?.name ?? "",
          });
        }

        const nextSession = res.data;
        state.stage = "question";
        state.session = nextSession;

        // Reset inactivity timer
        clearTimeout(state.timeout);
        state.timeout = setTimeout(() => {
          sessions.delete(key);
          state.sock.sendMessage(jid, {
            text: t("game.akinator.timeout"),
          });
        }, 120_000);
        state.lastActive = Date.now();

        const translatedQuestion = await translateToId(nextSession.question);
        return t("game.akinator.question", {
          step: nextSession.step + 1,
          progression: nextSession.progression,
          question: translatedQuestion,
        });
      } catch (err: unknown) {
        const errStr = String(err);
        if (errStr.includes("No more questions")) {
          clearTimeout(state.timeout);
          sessions.delete(key);
          return t("game.akinator.noMoreQuestions");
        }
        logger.error(err, "Akinator exclude error");
        return t("game.akinator.excludeConnError", { name: state.currentGuess?.name ?? "" });
      } finally {
        state.isProcessing = false;
      }
    }
  }

  return null;
}
