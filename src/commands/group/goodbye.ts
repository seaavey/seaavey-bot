import { toggleCommand } from "@/utils/group-toggle";

export default toggleCommand({
  name: "Goodbye",
  alias: ["bye", "goodbye"],
  field: "goodbye",
  description: "Toggle goodbye message on/off",
});
