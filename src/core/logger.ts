import { mkdirSync } from "node:fs";
import pino from "pino";
import { isDev } from "@/core/config";

mkdirSync("logs", { recursive: true });

const today = new Date().toISOString().slice(0, 10);

export const logger = pino({
  level: isDev ? "info" : "silent",
  transport: {
    targets: [
      { target: "pino/file", options: { destination: `logs/${today}.log` } },
      { target: "pino-pretty", options: { colorize: true } },
    ],
  },
});
