import { t } from "@/core/translations";
import { defineCommand } from "@/core/types";
import { addXp } from "@/infra/database";
import { getRandomItem } from "@/utils/helper";

const sessions = new Map<
  string,
  {
    board: string[];
    playerX: string;
    playerO: string;
    turn: string;
    timeout: Timer;
  }
>();

function renderBoard(board: string[]): string {
  const cell = (v: string | undefined) => (v === "X" ? "✕" : v === "O" ? "◯" : (v ?? ""));
  return `
 ${cell(board[0])} │ ${cell(board[1])} │ ${cell(board[2])}
───┼───┼───
 ${cell(board[3])} │ ${cell(board[4])} │ ${cell(board[5])}
───┼───┼───
 ${cell(board[6])} │ ${cell(board[7])} │ ${cell(board[8])}
`.trim();
}

function checkWin(board: string[], mark: string): boolean {
  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  return wins.some(
    ([a, b, c]) =>
      board[a as number] === mark && board[b as number] === mark && board[c as number] === mark,
  );
}

function botMove(board: string[]): number {
  const empty = board.map((v, i) => (v !== "X" && v !== "O" ? i : -1)).filter((i) => i !== -1);
  for (const i of empty) {
    board[i] = "O";
    if (checkWin(board, "O")) {
      board[i] = String(i + 1);
      return i;
    }
    board[i] = String(i + 1);
  }
  for (const i of empty) {
    board[i] = "X";
    if (checkWin(board, "X")) {
      board[i] = String(i + 1);
      return i;
    }
    board[i] = String(i + 1);
  }
  if (empty.includes(4)) return 4;
  return getRandomItem(empty) ?? 0;
}

export default defineCommand({
  name: "Tic Tac Toe",
  alias: ["ttt", "tic", "tictactoe"],
  description: t("game.tictactoe.desc"),
  handler: async (sock, msg) => {
    const session = sessions.get(msg.jid);

    if (!session) {
      const target = msg.mentioned?.[0] || (msg.args[0] === "bot" ? "bot" : null);

      if (msg.args.length > 0 && !target) {
        return msg.reply(t("game.tictactoe.usage"));
      }

      const isBot = (target || "bot") === "bot";
      const finalTarget = target || "bot";

      const board = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
      const timeout = setTimeout(() => {
        sessions.delete(msg.jid);
        sock.sendMessage(msg.jid, { text: t("game.tictactoe.timeout") });
      }, 120_000);

      sessions.set(msg.jid, {
        board,
        playerX: msg.sender,
        playerO: finalTarget,
        turn: msg.sender,
        timeout,
      });

      return msg.send({
        text: t("game.tictactoe.start", {
          playerX: msg.sender.split("@")[0],
          playerO: isBot ? "Bot" : finalTarget.split("@")[0],
          board: renderBoard(board),
          turn: msg.sender.split("@")[0],
        }),
        mentions: [msg.sender, ...(isBot ? [] : [finalTarget])],
      });
    }

    if (msg.args[0] === "nyerah") {
      if (msg.sender !== session.playerX && msg.sender !== session.playerO) return;
      clearTimeout(session.timeout);
      sessions.delete(msg.jid);
      return msg.reply(t("game.tictactoe.surrender"));
    }

    if (msg.sender !== session.turn) {
      return msg.send({
        text: t("game.tictactoe.notYourTurn", { player: session.turn.split("@")[0] }),
        mentions: [session.turn],
      });
    }

    const pos = Number(msg.args[0]) - 1;
    if (
      Number.isNaN(pos) ||
      pos < 0 ||
      pos > 8 ||
      session.board[pos] === "X" ||
      session.board[pos] === "O"
    ) {
      return msg.reply(t("game.tictactoe.invalidMove"));
    }

    const mark = msg.sender === session.playerX ? "X" : "O";
    session.board[pos] = mark;

    if (checkWin(session.board, mark)) {
      clearTimeout(session.timeout);
      sessions.delete(msg.jid);
      addXp(msg.sender, 20);
      return msg.send({
        text: t("game.tictactoe.win", {
          board: renderBoard(session.board),
          winner: msg.sender.split("@")[0],
        }),
        mentions: [msg.sender],
      });
    }

    if (!session.board.some((v) => v !== "X" && v !== "O")) {
      clearTimeout(session.timeout);
      sessions.delete(msg.jid);
      return msg.reply(t("game.tictactoe.draw", { board: renderBoard(session.board) }));
    }

    if (session.playerO === "bot") {
      const botIdx = botMove(session.board);
      session.board[botIdx] = "O";

      if (checkWin(session.board, "O")) {
        clearTimeout(session.timeout);
        sessions.delete(msg.jid);
        return msg.reply(t("game.tictactoe.botWins", { board: renderBoard(session.board) }));
      }

      if (!session.board.some((v) => v !== "X" && v !== "O")) {
        clearTimeout(session.timeout);
        sessions.delete(msg.jid);
        return msg.reply(t("game.tictactoe.draw", { board: renderBoard(session.board) }));
      }

      session.turn = session.playerX;
      session.timeout.refresh();
      return msg.send({
        text: t("game.tictactoe.turn", {
          board: renderBoard(session.board),
          player: session.turn.split("@")[0],
        }),
        mentions: [session.turn],
      });
    }

    session.turn = msg.sender === session.playerX ? session.playerO : session.playerX;
    session.timeout.refresh();
    await msg.send({
      text: t("game.tictactoe.turn", {
        board: renderBoard(session.board),
        player: session.turn.split("@")[0],
      }),
      mentions: [session.turn],
    });
  },
});
