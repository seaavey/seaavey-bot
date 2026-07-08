import { createWriteStream, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pipeline } from "node:stream/promises";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

export interface YouTubeData {
  title: string;
  thumbnail: string;
  downloadUrl: string;
  format: string;
  duration?: number;
  filesize?: number;
  localFile?: string;
}

const API_HOST = "epsilon.epsiloncloud.org";
const BASE_HEADERS: Record<string, string> = {
  Origin: "https://convertytmp3.org",
  Referer: "https://convertytmp3.org/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0",
  Accept: "*/*",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "cross-site",
};

function extractVideoId(url: string): string {
  const normalized = url
    .replace("music.youtube.com", "www.youtube.com")
    .replace(/youtu\.be\/([a-zA-Z0-9_-]+)/, "www.youtube.com/watch?v=$1");
  const m = normalized.match(/[?&]v=([a-zA-Z0-9-_]{11})/);
  return m?.[1] ?? "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(url: string, auth?: string, retry = 0): Promise<any> {
  const h = { ...BASE_HEADERS };
  if (auth) h["Authorization"] = `Bearer ${auth}`;
  const r = await fetch(url, { headers: h });
  if (r.status === 403 && retry < 3) {
    await new Promise((r) => setTimeout(r, 2000));
    return call(url, auth, retry + 1);
  }
  const body = await r.text();
  if (!r.ok) throw new Error(`Epsilon ${r.status}`);
  return JSON.parse(body);
}

async function downloadFile(url: string): Promise<string> {
  const tmpDir = mkdtempSync(join(tmpdir(), "epsilon-"));
  const outPath = join(tmpDir, "audio.mp3");
  const dl = await fetch(url, { headers: BASE_HEADERS, redirect: "follow" });
  if (!dl.ok || !dl.body) throw new Error(`download ${dl.status}`);
  await pipeline(dl.body as ReadableStream<Uint8Array>, createWriteStream(outPath));
  return outPath;
}

async function epsilonDownload(
  url: string,
  format: "mp3" | "mp4",
): Promise<ScraperResult<YouTubeData>> {
  try {
    const id = extractVideoId(url);
    if (!id) return scraperError("Invalid YouTube URL");

    const { key } = await call(
      `https://${API_HOST}/api/v1/auth?_=${Date.now()}`,
    ) as { key?: string };
    if (!key) return scraperError("No auth key");

    const session = await call(
      `https://${API_HOST}/api/v1/init?_=${Date.now()}`,
      key,
    ) as { convertURL?: string };
    if (!session.convertURL) return scraperError("No convert URL");

    let step = await call(
      `${session.convertURL}&v=${id}&f=${format}&_=${Date.now()}`,
    ) as { redirectURL?: string; progressURL?: string; downloadURL?: string; title?: string };

    while (step.redirectURL) {
      step = await call(
        `${step.redirectURL}&v=${id}&f=${format}&_=${Date.now()}`,
      ) as typeof step;
    }

    const progressURL = step.progressURL;
    let downloadURL = step.downloadURL;
    const title = step.title || "Unknown";
    const thumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

    if (!downloadURL && progressURL) {
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const p = await call(`${progressURL}&_=${Date.now()}`) as { progress?: number; downloadURL?: string };
          if (p.downloadURL) downloadURL = p.downloadURL;
          if ((p.progress ?? 0) >= 3) break;
        } catch { /* retry */ }
      }
    }

    if (!downloadURL) return scraperError("No download URL obtained");

    const localFile = await downloadFile(
      `${downloadURL}&v=${id}&f=${format}&r=cli`,
    );

    return scraperSuccess({ title, thumbnail, downloadUrl: downloadURL, format, localFile });
  } catch (e: unknown) {
    return scraperError((e as { message?: string }).message || "Epsilon download failed");
  }
}

export const ytmp3 = (url: string) => epsilonDownload(url, "mp3");
export const ytmp4 = (url: string) => epsilonDownload(url, "mp4");
