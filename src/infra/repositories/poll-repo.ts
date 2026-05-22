import db from "@/infra/db/client";

db.run(`
  CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupJid TEXT,
    creator TEXT,
    question TEXT,
    options TEXT,
    votes TEXT DEFAULT '{}',
    active INTEGER DEFAULT 1,
    timestamp INTEGER DEFAULT 0
  )
`);

export function createPoll(groupJid: string, creator: string, question: string, options: string[]) {
  db.run(
    "INSERT INTO polls (groupJid, creator, question, options, votes, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    [groupJid, creator, question, JSON.stringify(options), JSON.stringify({}), Date.now()],
  );
  return db.query("SELECT last_insert_rowid() as id").get() as { id: number };
}

export function getPoll(groupJid: string) {
  return db
    .query("SELECT * FROM polls WHERE groupJid = ? AND active = 1 ORDER BY id DESC LIMIT 1")
    .get(groupJid) as {
    id: number;
    creator: string;
    question: string;
    options: string;
    votes: string;
    timestamp: number;
  } | null;
}

export function getPollOptions(poll: { options: string }): string[] {
  return JSON.parse(poll.options) as string[];
}

export function getPollVotes(poll: { votes: string }): Record<string, number> {
  return JSON.parse(poll.votes) as Record<string, number>;
}

export function votePoll(pollId: number, voter: string, optionIndex: number) {
  const poll = db.query("SELECT votes FROM polls WHERE id = ?").get(pollId) as {
    votes: string;
  } | null;
  if (!poll) return false;
  const votes = getPollVotes(poll);
  votes[voter] = optionIndex;
  db.run("UPDATE polls SET votes = ? WHERE id = ?", [JSON.stringify(votes), pollId]);
  return true;
}

export function closePoll(pollId: number) {
  db.run("UPDATE polls SET active = 0 WHERE id = ?", [pollId]);
}
