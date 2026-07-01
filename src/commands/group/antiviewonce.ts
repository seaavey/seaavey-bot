import { toggleCommand } from "@/utils/group-toggle";

export default toggleCommand({
  name: "Anti View Once",
  field: "antiviewonce",
  alias: ["avo", "antiviewonce"],
  description: "Toggle anti-viewonce on/off. View once messages will be forwarded.",
});
