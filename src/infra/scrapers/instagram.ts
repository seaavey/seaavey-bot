import axios from "axios";
import * as cheerio from "cheerio";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

const API = "https://insaver.io";
const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

export interface InstagramMedia {
  type: "video" | "image";
  url: string;
  thumbnail: string | null;
}

function extractCookie(headers: Record<string, unknown>): string {
  const raw = headers["set-cookie"];
  if (!raw) return "";
  const cookies = Array.isArray(raw) ? raw : [raw];
  return cookies.map((c: string) => c.split(";")[0]).join("; ");
}

function clean(url: string) {
  return String(url || "")
    .replaceAll("&amp;", "&")
    .trim();
}

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))];
}

function parseResult(html: string): InstagramMedia[] {
  const $ = cheerio.load(html);
  const results: InstagramMedia[] = [];

  $("#result .card, .hero-results .card").each((_, el) => {
    const card = $(el);
    const links = uniq(
      card
        .find("a[href]")
        .map((_, a) => clean($(a).attr("href") || ""))
        .get()
        .filter((u) => /^https?:\/\//i.test(u)),
    );
    const videos = uniq(
      card
        .find("video[src]")
        .map((_, v) => clean($(v).attr("src") || ""))
        .get()
        .filter((u) => /^https?:\/\//i.test(u)),
    );
    const posters = uniq(
      card
        .find("video[poster], img[src]")
        .map((_, x) => clean($(x).attr("poster") || $(x).attr("src") || ""))
        .get()
        .filter((u) => /^https?:\/\//i.test(u)),
    );

    const download =
      links.find((u) => u.includes(".mp4") || u.includes("cdninstagram")) || videos[0] || links[0];

    if (download) {
      results.push({
        type: download.includes(".mp4") || videos.length ? "video" : "image",
        url: download,
        thumbnail: posters[0] || null,
      });
    }
  });

  if (!results.length) {
    const fallback = uniq(
      $("a[href], video[src]")
        .map((_, el) => clean($(el).attr("href") || $(el).attr("src") || ""))
        .get()
        .filter(
          (u) => /^https?:\/\//i.test(u) && (u.includes("cdninstagram") || u.includes(".mp4")),
        ),
    );
    for (const url of fallback) {
      results.push({
        type: url.includes(".mp4") ? "video" : "image",
        url,
        thumbnail: null,
      });
    }
  }

  return results;
}

export async function instagramDl(url: string): Promise<ScraperResult<InstagramMedia[]>> {
  try {
    const page = await axios.get(`${API}/`, {
      headers: {
        "user-agent": UA,
        "accept-language": "id-ID,id;q=0.9",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "upgrade-insecure-requests": "1",
      },
    });

    const $ = cheerio.load(page.data || "");
    const token = $('input[name="token"]').attr("value");
    if (!token) throw new Error("Token not found");

    const cookie = extractCookie(page.headers as Record<string, unknown>);

    const form = new URLSearchParams({
      link: url,
      token,
      action: $('input[name="action"]').attr("value") || "insta",
      lang: $('input[name="lang"]').attr("value") || "en",
      url_source: $('input[name="url_source"]').attr("value") || "/",
    });

    const res = await axios.post(`${API}/download`, form, {
      headers: {
        "user-agent": UA,
        "accept-language": "id-ID,id;q=0.9",
        origin: API,
        referer: `${API}/`,
        "content-type": "application/x-www-form-urlencoded",
        ...(cookie ? { cookie } : {}),
      },
    });

    const results = parseResult(res.data || "");
    if (!results.length) throw new Error("Media not found");

    return scraperSuccess(results);
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}
