import { toggleCommand } from "@/utils/group-toggle";

export default toggleCommand({
  name: "Auto Sticker",
  field: "autosticker",
  alias: ["as", "autos", "autosticker"],
  description: "Toggle autosticker on/off",
});
