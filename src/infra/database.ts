import db from "@/infra/client";

export { getAfk, removeAfk, setAfk } from "@/infra/repositories/afk-repo";
export {
  addAutoReply,
  findAutoReply,
  getAutoReplies,
  removeAutoReply,
} from "@/infra/repositories/autoreply-repo";
export {
  creditWallet,
  debitWallet,
  getEconomy,
  setLastDaily,
  transferMoney,
} from "@/infra/repositories/economy-repo";
export {
  countGroupMembers,
  ensureGroupMember,
  type Group,
  getGroup,
  getSiders,
  recordMemberChat,
  removeGroupMember,
  setGroup,
} from "@/infra/repositories/group-repo";
export {
  closePoll,
  createPoll,
  getPoll,
  getPollOptions,
  getPollVotes,
  votePoll,
} from "@/infra/repositories/poll-repo";
export {
  addReminder,
  addSchedule,
  deleteSchedule,
  getPendingReminders,
  getPendingSchedules,
  getSchedules,
  markReminderDone,
  markScheduleDone,
  reschedule,
} from "@/infra/repositories/schedule-repo";
export {
  addHit,
  addLevel,
  addXp,
  addXpManual,
  getUser,
  isBanned,
  setBanned,
  setLevel,
  setXp,
} from "@/infra/repositories/user-repo";
export { addWarn, getWarns, removeWarns } from "@/infra/repositories/warn-repo";

export default db;
