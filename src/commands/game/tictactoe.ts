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
  description: "Play tic-tac-toe against bot or other member",
  handler: async (sock, msg) => {
    const session = sessions.get(msg.jid);

    if (!session) {
      const target = msg.mentioned?.[0] || (msg.args[0] === "bot" ? "bot" : null);

      if (msg.args.length > 0 && !target) {
        return msg.reply("Type .tictactoe or .tictactoe @tag to start.");
      }

      const isBot = (target || "bot") === "bot";
      const finalTarget = target || "bot";

      const board = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
      const timeout = setTimeout(() => {
        sessions.delete(msg.jid);
        sock.sendMessage(msg.jid, { text: "⏰ Time's up! Tic-Tac-Toe game stopped." });
      }, 120_000);

      sessions.set(msg.jid, {
        board,
        playerX: msg.sender,
        playerO: finalTarget,
        turn: msg.sender,
        timeout,
      });

      return msg.send({
        text: `🚩: @${msg.sender.split("@")[0]}
⭕: @${isBot ? "Bot" : finalTarget.split("@")[0]}

${renderBoard(board)}

It is @${msg.sender.split("@")[0]}'s turn!`,
        mentions: [msg.sender, ...(isBot ? [] : [finalTarget])],
      });
    }

    if (msg.args[0] === "nyerah") {
      if (msg.sender !== session.playerX && msg.sender !== session.playerO) return;
      clearTimeout(session.timeout);
      sessions.delete(msg.jid);
      return msg.reply("🏳️ Game stopped.");
    }

    if (msg.sender !== session.turn) {
      return msg.send({
        text: `🚩 Not your turn! Wait for @${session.turn.split("@")[0]}`,
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
      return msg.reply("🚩 Invalid position! Choose 1-9 that is still empty.");
    }

    const mark = msg.sender === session.playerX ? "X" : "O";
    session.board[pos] = mark;

    if (checkWin(session.board, mark)) {
      clearTimeout(session.timeout);
      sessions.delete(msg.jid);
      addXp(msg.sender, 20);
      return msg.send({
        text: `${renderBoard(session.board)}

🎉 @${msg.sender.split("@")[0]} wins! (+20 XP)`,
        mentions: [msg.sender],
      });
    }

    if (!session.board.some((v) => v !== "X" && v !== "O")) {
      clearTimeout(session.timeout);
      sessions.delete(msg.jid);
      return msg.reply("🤝 Draw!");
    }

    if (session.playerO === "bot") {
      const botIdx = botMove(session.board);
      session.board[botIdx] = "O";

      if (checkWin(session.board, "O")) {
        clearTimeout(session.timeout);
        sessions.delete(msg.jid);
        return msg.reply("😢 Bot wins!");
      }

      if (!session.board.some((v) => v !== "X" && v !== "O")) {
        clearTimeout(session.timeout);
        sessions.delete(msg.jid);
        return msg.reply("🤝 Draw!");
      }

      session.turn = session.playerX;
      session.timeout.refresh();
      return msg.send({
        text: `Turn: @${session.turn.split("@")[0]}`,
        mentions: [session.turn],
      });
    }

    session.turn = msg.sender === session.playerX ? session.playerO : session.playerX;
    session.timeout.refresh();
    await msg.send({
      text: `Turn: @${session.turn.split("@")[0]}`,
      mentions: [session.turn],
    });
  },
});
