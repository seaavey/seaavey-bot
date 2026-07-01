import { toggleCommand } from "@/utils/group-toggle";

export default toggleCommand({
  name: "Anti Link",
  alias: ["alink", "antilink"],
  field: "antilink",
  description: "Toggle antilink on/off",
});
