import axios from "axios";
import * as cheerio from "cheerio";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

export interface FbdlData {
  url: string;
  quality: string;
  title: string | null;
  thumbnail: string | null;
}

export async function fsaver(url: string): Promise<ScraperResult<FbdlData[]>> {
  try {
    const challenge = await axios.post(
      "https://fsaver.net/api/challenge",
      { url },
      {
        headers: {
          accept: "*/*",
          "content-type": "application/json",
          origin: "https://fsaver.net",
          "user-agent": UA,
        },
      },
    );

    const token = challenge.data?.token;
    if (!token) throw new Error("Token not found");

    const page = await axios.post(
      "https://fsaver.net/en/download",
      new URLSearchParams({ url, token }).toString(),
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": UA,
        },
      },
    );

    const $ = cheerio.load(page.data);

    const results: FbdlData[] = [];
    $("table tr").each((_, el) => {
      const href = $(el).find("a[download]").attr("href");
      if (!href) return;
      results.push({
        quality: $(el).find("td").eq(0).text().trim(),
        url: href,
        title:
          $(".download__item__profile_pic div")
            .first()
            .clone()
            .children()
            .remove()
            .end()
            .text()
            .trim() || null,
        thumbnail: $(".download__item__profile_pic img").attr("src") || null,
      });
    });

    return scraperSuccess(results);
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}
