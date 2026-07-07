import { groupMessageCommand } from "@/utils/group-message-command";

export default groupMessageCommand({
  name: "Welcome",
  alias: ["wel", "welcome"],
  field: "welcome",
  messageField: "welcomeMsg",
  label: "Welcome",
});
