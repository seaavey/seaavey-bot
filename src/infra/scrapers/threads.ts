import axios from "axios";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

export interface ThreadsMedia {
  index: number;
  type: string | null;
  url: string;
}

function uniqueMedia(media: unknown[]): ThreadsMedia[] {
  const seen = new Set<string>();
  const result: ThreadsMedia[] = [];

  for (const item of media) {
    const obj = item as { url?: string; type?: string } | undefined;
    if (!obj?.url || seen.has(obj.url)) continue;
    seen.add(obj.url);
    result.push({
      index: result.length + 1,
      type: obj.type || null,
      url: obj.url,
    });
  }

  return result;
}

export async function threadsDl(url: string): Promise<ScraperResult<ThreadsMedia[]>> {
  try {
    const res = await axios.get("https://threadsvideo.romitkr5539.workers.dev", {
      timeout: 60000,
      validateStatus: () => true,
      params: { url },
      headers: {
        "sec-ch-ua-platform": `"Android"`,
        "user-agent": UA,
        "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
        "sec-ch-ua-mobile": "?1",
        accept: "*/*",
        origin: "https://threadsgrab.com",
        "sec-fetch-site": "cross-site",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        referer: "https://threadsgrab.com/",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        priority: "u=1, i",
      },
    });

    const data = res.data as {
      success?: boolean;
      media?: unknown[];
      message?: string;
      error?: string;
    };

    if (res.status < 200 || res.status >= 300 || !data.success) {
      return scraperError(data.message || data.error || `HTTP ${res.status}`);
    }

    const result = uniqueMedia(data.media ?? []);

    if (result.length === 0) {
      return scraperError("No media found");
    }

    return scraperSuccess(result);
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}
