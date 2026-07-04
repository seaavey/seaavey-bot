import { execSync } from "node:child_process";
import { logger } from "@/core/logger";
import { config } from "@/core/config";

let statusShown = false;

export function checkGitUpdate() {
  if (statusShown) return;
  statusShown = true;

  try {
    execSync("git fetch origin --quiet", { stdio: "ignore", timeout: 15000 });

    const aheadBehind = execSync(
      "git rev-list --left-right --count origin/main...HEAD",
      { encoding: "utf-8", timeout: 10000 },
    ).trim();

    const [behind, ahead] = aheadBehind.split("\t").map(Number);
    const total = (behind ?? 0) + (ahead ?? 0);

    if (total === 0) {
      logger.info(`${config.name} is up to date with origin/main ✅`);
    } else {
      const parts: string[] = [];
      if (behind && behind > 0) parts.push(`${behind} commit(s) behind`);
      if (ahead && ahead > 0) parts.push(`${ahead} commit(s) ahead`);
      logger.info(`${config.name} is ${parts.join(", ")} from origin/main`);
    }

    const current = execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    logger.info(`Commit: ${current}`);
  } catch {
    logger.warn("Git check skipped (not a git repo or no network)");
  }
}
