import axios from "axios";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

export interface TwitterData {
  title: string;
  author: string;
  video: string | null;
  photo: string | null;
}

/**
 * Download media from X/Twitter via savetwitter.net.
 * Supports both x.com and twitter.com URLs.
 */
export async function twitterDl(url: string): Promise<ScraperResult<TwitterData>> {
  try {
    const { data } = await axios.post(
      "https://savetwitter.net/api/ajaxSearch",
      new URLSearchParams({ q: url }).toString(),
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": UA,
          origin: "https://savetwitter.net",
          referer: "https://savetwitter.net/en4",
        },
        timeout: 15_000,
      },
    );

    if (data.statusCode === 404) {
      throw new Error(data.msg || "Video not found or already deleted");
    }

    if (data.status !== "ok" || !data.data) {
      throw new Error("Failed to fetch data from Twitter/X");
    }

    const result = data.data;
    const video = result.video?.[0]?.url || result.video_url || null;
    const photo = result.image || result.photo || null;

    return scraperSuccess({
      title: result.title || result.text || "",
      author: result.author?.name || result.username || "",
      video,
      photo,
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}
