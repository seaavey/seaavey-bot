import { toggleCommand } from "@/utils/group-toggle";

export default toggleCommand({
  name: "Welcome",
  alias: ["wel", "welcome"],
  field: "welcome",
  description: "Toggle welcome message on/off",
});
