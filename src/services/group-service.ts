import db, { type Group, setGroup } from "@/infra/database";

function formatGroup(g: Group) {
  const members = (
    db.query("SELECT COUNT(*) as count FROM group_members WHERE groupJid = ?").get(g.jid) as {
      count: number;
    }
  ).count;
  return {
    jid: g.jid,
    name: g.name || g.jid.split("@")[0],
    members,
    status: g.mute ? "muted" : "active",
    welcome: !!g.welcome,
    goodbye: !!g.goodbye,
    antiSpam: !!g.antispam,
    antilink: !!g.antilink,
    antidelete: !!g.antidelete,
    antitoxic: !!g.antitoxic,
    antiviewonce: !!g.antiviewonce,
    autosticker: !!g.autosticker,
    onlyAdmin: !!g.onlyAdmin,
    warnMax: g.warnMax,
  };
}

export function listGroups() {
  const rows = db.query("SELECT * FROM groups").all() as Group[];
  return rows.map(formatGroup);
}

export function getGroupByJid(jid: string) {
  const g = db.query("SELECT * FROM groups WHERE jid = ?").get(jid) as Group | null;
  if (!g) return null;
  return formatGroup(g);
}

export interface GroupUpdateData {
  name?: string;
  status?: string;
  welcome?: boolean;
  goodbye?: boolean;
  antiSpam?: boolean;
  antilink?: boolean;
  antidelete?: boolean;
  antitoxic?: boolean;
  antiviewonce?: boolean;
  autosticker?: boolean;
  onlyAdmin?: boolean;
}

export function updateGroupSettings(jid: string, data: GroupUpdateData) {
  if (data.name !== undefined) setGroup(jid, "name", data.name);
  if (data.status !== undefined) setGroup(jid, "mute", data.status === "muted" ? 1 : 0);
  if (data.welcome !== undefined) setGroup(jid, "welcome", data.welcome ? 1 : 0);
  if (data.goodbye !== undefined) setGroup(jid, "goodbye", data.goodbye ? 1 : 0);
  if (data.antiSpam !== undefined) setGroup(jid, "antispam", data.antiSpam ? 1 : 0);
  if (data.antilink !== undefined) setGroup(jid, "antilink", data.antilink ? 1 : 0);
  if (data.antidelete !== undefined) setGroup(jid, "antidelete", data.antidelete ? 1 : 0);
  if (data.antitoxic !== undefined) setGroup(jid, "antitoxic", data.antitoxic ? 1 : 0);
  if (data.antiviewonce !== undefined) setGroup(jid, "antiviewonce", data.antiviewonce ? 1 : 0);
  if (data.autosticker !== undefined) setGroup(jid, "autosticker", data.autosticker ? 1 : 0);
  if (data.onlyAdmin !== undefined) setGroup(jid, "onlyAdmin", data.onlyAdmin ? 1 : 0);
  return getGroupByJid(jid);
}

export function setGroupMute(jid: string, muted: boolean) {
  setGroup(jid, "mute", muted ? 1 : 0);
  return { jid, status: muted ? "muted" : "active" };
}
