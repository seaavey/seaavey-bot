import { groupMessageCommand } from "@/utils/group-message-command";

export default groupMessageCommand({
  name: "Goodbye",
  alias: ["bye", "goodbye"],
  field: "goodbye",
  messageField: "goodbyeMsg",
  label: "Goodbye",
});
