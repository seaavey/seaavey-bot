import { Elysia } from "elysia";
import { listCommands, setCommandEnabled } from "@/services/command-service";

export const commandsRoutes = new Elysia({ prefix: "/api/commands" })
  .get("/", () => listCommands())
  .patch("/:name", ({ params, body }) => {
    const data = body as { enabled?: boolean };
    if (data.enabled === undefined) return { error: "Missing enabled field" };
    const result = setCommandEnabled(params.name, data.enabled);
    if (!result) return { error: "Command not found" };
    return result;
  })
  .post("/:name/enable", ({ params }) => {
    const result = setCommandEnabled(params.name, true);
    if (!result) return { error: "Command not found" };
    return result;
  })
  .post("/:name/disable", ({ params }) => {
    const result = setCommandEnabled(params.name, false);
    if (!result) return { error: "Command not found" };
    return result;
  });
