import axios from "axios";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

export interface PinterestPin {
  id: string;
  title: string;
  image: string;
  video?: string;
  url: string;
}

/**
 * Convert any Pinterest thumbnail URL to original resolution.
 * e.g. i.pinimg.com/60x60/... → i.pinimg.com/originals/...
 */
function toOriginal(url: string): string {
  return url
    .replace("i.pinimg.com/60x60/", "i.pinimg.com/originals/")
    .replace("i.pinimg.com/736x/", "i.pinimg.com/originals/")
    .replace("i.pinimg.com/564x/", "i.pinimg.com/originals/");
}

/**
 * Search Pinterest pins by query.
 */
export async function pinterestSearch(
  query: string,
  limit = 5,
): Promise<ScraperResult<PinterestPin[]>> {
  try {
    const { data: html } = await axios.get(
      `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "user-agent": UA,
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: 15_000,
        responseType: "text",
      },
    );

    const results: PinterestPin[] = [];

    // Extract 736x thumbnail URLs (search result grid)
    const thumbRe = /i\.pinimg\.com\/736x\/[a-f0-9/]+\.\w+/g;
    const altRe = /alt="([^"]{3,200})"/g;
    const pinRe = /\/pin\/(\d+)\//g;

    const thumbs = Array.from(new Set([...html.matchAll(thumbRe)].map((m) => m[0])));
    const alts = [...html.matchAll(altRe)].map((m) => m[1]);
    const pinIds = Array.from(new Set([...html.matchAll(pinRe)].map((m) => m[1])));

    const count = Math.min(thumbs.length, limit);
    for (let i = 0; i < count; i++) {
      const imageUrl = `https://${thumbs[i]}`;
      const pinId = pinIds[i] || "";
      const title = alts[i] || "";

      results.push({
        id: pinId,
        title,
        image: toOriginal(imageUrl),
        url: pinId ? `https://www.pinterest.com/pin/${pinId}/` : imageUrl,
      });
    }

    if (!results.length) throw new Error("No results found");
    return scraperSuccess(results);
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}

const PINDOWN_BASE = "https://pindown.io";
const PINDOWN_ACTION = `${PINDOWN_BASE}/action`;

/**
 * Fetch pindown.io page to extract the current hidden token and session cookie.
 * Returns { name, value, cookie }.
 */
async function fetchPindownToken(): Promise<{ name: string; value: string; cookie: string }> {
  const { data: html, headers } = await axios.get<string>(`${PINDOWN_BASE}/id1`, {
    headers: { "user-agent": UA },
    timeout: 10_000,
    responseType: "text",
  });

  // Extract session_data cookie
  const setCookie = headers["set-cookie"];
  const cookie = setCookie?.[0]?.split(";")[0] || "";

  // Match: <input name="XXXX" type="hidden" value="YYYY"/>
  const match = html.match(/<input\s+name="([^"]+)"\s+type="hidden"\s+value="([^"]+)"\s*\/?>/);
  if (!match || !match[1] || !match[2]) throw new Error("Failed to get Pinterest token");
  return { name: match[1], value: match[2], cookie };
}

/**
 * Get full-size image/video from a Pinterest pin URL via pindown.io.
 * Supports: https://www.pinterest.com/pin/12345/
 *           https://pin.it/abc
 */
export async function pinterestDl(url: string): Promise<ScraperResult<PinterestPin>> {
  try {
    const token = await fetchPindownToken();

    const formData = new FormData();
    formData.append("url", url);
    formData.append(token.name, token.value);
    formData.append("lang", "id");

    const { data } = await axios.post<{ success: boolean; error?: boolean; html?: string }>(
      PINDOWN_ACTION,
      formData,
      {
        headers: {
          "user-agent": UA,
          cookie: token.cookie,
          origin: "https://pindown.io",
          referer: "https://pindown.io/id1",
        },
        timeout: 20_000,
      },
    );

    if (!data.success || !data.html) throw new Error("Failed to fetch Pinterest data");

    const html = data.html;

    // Title
    const titleMatch = html.match(/<strong>([^<]+)<\/strong>/);
    const title = titleMatch?.[1] || "";

    // Direct video URL (v1.pinimg.com)
    const videoMatch = html.match(/href='(https:\/\/v1\.pinimg\.com\/videos\/[^']+)'/);
    const videoUrl = videoMatch?.[1] || undefined;

    // Thumbnail / cover image (img src)
    const imgMatch = html.match(/<img src='([^']+)'/);
    let imageUrl = imgMatch?.[1] || "";

    // If we found a video but no good image, try to grab the cover from the video poster
    if (!imageUrl && videoUrl) {
      const posterMatch = html.match(/poster='([^']+)'/);
      imageUrl = posterMatch?.[1] || "";
    }

    if (!imageUrl && !videoUrl) throw new Error("Media not found");

    const idMatch = url.match(/\/pin\/(\d+)/);

    const result: PinterestPin = {
      id: idMatch?.[1] || "",
      title,
      image: imageUrl,
      url,
    };
    if (videoUrl) result.video = videoUrl;

    return scraperSuccess(result);
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}
