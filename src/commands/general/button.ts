import { readFileSync } from "node:fs";
import { sendInteractive } from "@/handlers/interactive";
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "button",
  description: "",
  handler: async (sock, msg) => {
    await sendInteractive(sock, msg.jid, {
      body: "Test",
      footer: "test",
      header: {
        image: readFileSync("src/assets/banner.png"),
      },
      buttons: [
        {
          name: "single_select",
          params: {
            title: "Pilih Menu",
            sections: [
              {
                title: "General",
                rows: [
                  { title: "Menu", id: ".menu", description: "Lihat semua command" },
                  { title: "Ping", id: ".ping", description: "Cek bot response" },
                ],
              },
              {
                title: "Group",
                rows: [
                  { title: "Kick", id: ".kick", description: "Kick member" },
                  { title: "Tagall", id: ".tagall", description: "Tag semua member" },
                ],
              },
            ],
          },
        },
      ],
    });
  },
});
