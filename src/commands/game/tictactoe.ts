import { addXp } from "@/infra/database";
import { getRandomItem } from "@/utils/helper";
import { defineCommand } from "@/core/types";

const sessions = new Map<string, { board: string[]; turn: "X" | "O"; timeout: Timer }>();

function renderBoard(board: string[]): string {
  return `${board[0]}│${board[1]}│${board[2]}\n─┼─┼─\n${board[3]}│${board[4]}│${board[5]}\n─┼─┼─\n${board[6]}│${board[7]}│${board[8]}`;
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
  // Try to win
  for (const i of empty) {
    board[i] = "O";
    if (checkWin(board, "O")) {
      board[i] = String(i + 1);
      return i;
    }
    board[i] = String(i + 1);
  }
  // Try to block
  for (const i of empty) {
    board[i] = "X";
    if (checkWin(board, "X")) {
      board[i] = String(i + 1);
      return i;
    }
    board[i] = String(i + 1);
  }
  // Center or random
  if (empty.includes(4)) return 4;
  return getRandomItem(empty) ?? 0;
}

export default defineCommand({
  name: "tictactoe",
  description: "Main tic-tac-toe lawan bot",
  handler: async (sock, msg) => {
    const key = `${msg.jid}:${msg.sender}`;

    if (!msg.args[0]) {
      const board = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
      const jid = msg.jid;
      const timeout = setTimeout(() => {
        sessions.delete(key);
        sock.sendMessage(jid, { text: "⏰ Waktu habis! Game Tic-Tac-Toe dibatalkan." });
      }, 120_000);
      sessions.set(key, { board, turn: "X", timeout });
      return msg.reply(
        `🎮 *Tic-Tac-Toe*\nKamu: ❌ | Bot: ⭕\n\n${renderBoard(board)}\n\nKetik .tictactoe [1-9] (120 detik)`,
      );
    }

    const session = sessions.get(key);
    if (!session) return msg.reply("Ketik .tictactoe untuk mulai game baru.");

    if (msg.args[0] === "nyerah") {
      clearTimeout(session.timeout);
      sessions.delete(key);
      return msg.reply("🏳️ Menyerah! Game selesai.");
    }

    const pos = Number(msg.args[0]) - 1;
    if (pos < 0 || pos > 8 || session.board[pos] === "X" || session.board[pos] === "O") {
      return msg.reply("❌ Posisi tidak valid! Pilih 1-9 yang masih kosong.");
    }

    session.board[pos] = "X";
    if (checkWin(session.board, "X")) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      addXp(msg.sender, 20);
      return msg.reply(`${renderBoard(session.board)}\n\n🎉 Kamu menang! (+20 XP)`);
    }

    if (!session.board.some((v) => v !== "X" && v !== "O")) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      return msg.reply(`${renderBoard(session.board)}\n\n🤝 Seri!`);
    }

    const bot = botMove(session.board);
    session.board[bot] = "O";
    if (checkWin(session.board, "O")) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      return msg.reply(`${renderBoard(session.board)}\n\n😢 Bot menang!`);
    }

    if (!session.board.some((v) => v !== "X" && v !== "O")) {
      clearTimeout(session.timeout);
      sessions.delete(key);
      return msg.reply(`${renderBoard(session.board)}\n\n🤝 Seri!`);
    }

    await msg.reply(`${renderBoard(session.board)}\n\nGiliranmu! Ketik .tictactoe [1-9]`);
  },
});
