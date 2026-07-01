import axios from "axios";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

export interface SswebData {
  url: string;
}

/**
 * Screenshot website via pageshot.site (free, no API key).
 * Primary: pageshot.site
 * Backup: webshot.site
 */
export async function sswebDl(
  url: string,
  mode: "desktop" | "mobile" = "desktop",
): Promise<ScraperResult<SswebData>> {
  const width = mode === "mobile" ? 390 : 1280;
  const height = mode === "mobile" ? 844 : 720;

  // Try primary: pageshot.site
  try {
    const screenshotUrl = `https://pageshot.site/api?url=${encodeURIComponent(url)}&width=${width}&height=${height}&format=png`;
    const { status } = await axios.head(screenshotUrl, { timeout: 10_000 });
    if (status === 200) {
      return scraperSuccess({ url: screenshotUrl });
    }
  } catch {
    // Fall through to backup
  }

  // Backup: webshot.site
  try {
    const screenshotUrl = `https://webshot.site/api?url=${encodeURIComponent(url)}&format=png`;
    const { status } = await axios.head(screenshotUrl, { timeout: 10_000 });
    if (status === 200) {
      return scraperSuccess({ url: screenshotUrl });
    }
  } catch {
    // Fall through to error
  }

  return scraperError("Failed to take screenshot. Try again later.");
}
