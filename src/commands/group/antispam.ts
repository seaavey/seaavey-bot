import { toggleCommand } from "@/utils/group-toggle";

export default toggleCommand({
  name: "Anti Spam",
  alias: ["spam", "antispam"],
  field: "antispam",
  description: "Toggle antispam on/off",
});
