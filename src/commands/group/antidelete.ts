import { toggleCommand } from "@/utils/group-toggle";

export default toggleCommand({
  name: "Anti Delete",
  alias: ["adel", "antidelete"],
  field: "antidelete",
  description: "Toggle antidelete on/off",
});
