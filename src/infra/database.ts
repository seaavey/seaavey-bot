import db from "@/infra/db/client";

export { getAfk, removeAfk, setAfk } from "@/infra/repositories/afk-repo";
export {
  addAutoReply,
  findAutoReply,
  getAutoReplies,
  removeAutoReply,
} from "@/infra/repositories/autoreply-repo";
export {
  addWallet,
  getEconomy,
  setLastDaily,
  transferMoney,
} from "@/infra/repositories/economy-repo";
export {
  type Group,
  getGroup,
  getSiders,
  setGroup,
  updateMemberChat,
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
  addToxicWord,
  getToxicWords,
  isToxicMessage,
  removeToxicWord,
} from "@/infra/repositories/toxic-repo";
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
