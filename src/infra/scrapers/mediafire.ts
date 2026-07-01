import axios from "axios";
import * as cheerio from "cheerio";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

export interface MediaFireData {
  filename: string;
  url: string;
  size: string;
}

/**
 * Download file from MediaFire.
 * Supports: https://www.mediafire.com/file/{id}/{filename}/file
 */
export async function mediafireDl(url: string): Promise<ScraperResult<MediaFireData>> {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 15_000,
      responseType: "text",
    });

    const $ = cheerio.load(html);

    // Check for error pages
    if ($("body").hasClass("errorFileMissing") || $("body").hasClass("errorFileBlocked")) {
      throw new Error("File not found or already deleted");
    }

    // Extract filename from input#download_input value or page title
    let filename =
      $("input#download_input").attr("value") ||
      $("div.filename").text().trim() ||
      $("h1").text().trim();

    // Extract download link
    // Method 1: input with download URL
    let downloadUrl =
      $("input#download_input").attr("value") ||
      $("a#downloadButton").attr("href") ||
      $('a[href*="download.mediafire.com"]').attr("href");

    // Method 2: parse from JavaScript
    if (!downloadUrl) {
      const match = html.match(/var\s+download_url\s*=\s*['"]([^'"]+)['"]/);
      if (match) downloadUrl = match[1];
    }

    // Method 3: look for download link in various formats
    if (!downloadUrl) {
      downloadUrl =
        $("a.popsok").attr("href") ||
        $('a[title*="Download"]').attr("href") ||
        $("a.download_link").attr("href");
    }

    // Method 4: regex for mediafire download URL
    if (!downloadUrl) {
      const match = html.match(/https?:\/\/download\d*\.mediafire\.com\/[^\s"'<>]+/i);
      if (match) downloadUrl = match[0];
    }

    if (!downloadUrl) throw new Error("Download link not found");

    // Extract file size
    const size = $("div.filesize").text().trim() || $("span.file-size").text().trim() || "";

    // Clean filename
    if (filename) {
      filename = filename.replace(/^Download\s*/i, "").trim();
    }

    return scraperSuccess({
      filename: filename || "unknown",
      url: downloadUrl,
      size,
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}
