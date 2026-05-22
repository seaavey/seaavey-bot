import { Elysia } from "elysia";
import {
  type GroupUpdateData,
  getGroupByJid,
  listGroups,
  setGroupMute,
  updateGroupSettings,
} from "@/services/group-service";

export const groupsRoutes = new Elysia({ prefix: "/api/groups" })
  .get("/", () => listGroups())
  .get("/:jid", ({ params }) => {
    const g = getGroupByJid(params.jid);
    if (!g) return { error: "Group not found" };
    return g;
  })
  .patch("/:jid", ({ params, body }) => {
    const result = updateGroupSettings(params.jid, body as GroupUpdateData);
    if (!result) return { error: "Group not found" };
    return result;
  })
  .post("/:jid/mute", ({ params }) => setGroupMute(params.jid, true))
  .post("/:jid/unmute", ({ params }) => setGroupMute(params.jid, false));
