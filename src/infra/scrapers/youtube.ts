import { execFile } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import axios from "axios";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

const execFileAsync = promisify(execFile);

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface YouTubeData {
  title: string;
  thumbnail: string;
  downloadUrl: string;
  format: string;
  duration?: number;
  filesize?: number;
  localFile?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function findYtDlp(): string {
  const candidates = [
    join(import.meta.dir, "../../../node_modules/.bin/yt-dlp"),
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
    join(process.env.HOME || "/home/ubuntu", ".local/bin/yt-dlp"),
    "yt-dlp",
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return "yt-dlp";
}

function findCookiesFile(): string | null {
  const candidates = [
    join(import.meta.dir, "../../../cookies.txt"),
    join(process.env.HOME || "/home/ubuntu", "cookies.txt"),
    join(process.env.HOME || "/home/ubuntu", ".config/yt-dlp/cookies.txt"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function normalizeUrl(url: string): string {
  let n = url.replace("music.youtube.com", "www.youtube.com");
  n = n.replace(/youtu\.be\/([a-zA-Z0-9_-]+)/, "www.youtube.com/watch?v=$1");
  return n;
}

function extractVideoId(url: string): string {
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return m?.[1] || "";
}

/**
 * Verify that a URL actually returns media (not HTML/ad page).
 * Uses a small GET with Range header — cheap and reliable.
 */
async function isMediaUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-511", "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    const ct = res.headers.get("content-type") || "";
    // If it returns HTML, it's an ad page
    if (ct.includes("text/html")) return false;

    // Check first bytes for audio/video signatures
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) return false;

    const bytes = new Uint8Array(buf.slice(0, 16));
    const header = new TextDecoder().decode(bytes);

    // Common signatures: ID3 (MP3), ftyp (MP4/M4A), OggS (OGG), RIFF (WAV)
    if (
      header.startsWith("ID3") ||
      header.includes("ftyp") ||
      header.includes("OggS") ||
      header.includes("RIFF") ||
      ct.includes("audio/") ||
      ct.includes("video/")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// ─── Audio Download + Convert ─────────────────────────────────────

async function downloadAndConvertMp3(url: string): Promise<string | null> {
  const tmpDir = mkdtempSync(join(tmpdir(), "yt-"));
  const inputFile = join(tmpDir, "audio");
  const outputFile = join(tmpDir, "audio.mp3");
  try {
    // Download with yt-dlp
    const args = ["-f", "bestaudio/best", "-o", inputFile, "--no-playlist", "--no-warnings", url];
    await execFileAsync(findYtDlp(), args, { timeout: 60_000 });
    // Find the downloaded file (yt-dlp may add extension)
    const files = [
      join(tmpDir, "audio.m4a"),
      join(tmpDir, "audio.webm"),
      join(tmpDir, "audio.opus"),
      join(tmpDir, "audio.mp3"),
      join(tmpDir, "audio"),
    ];
    const input = files.find((f) => existsSync(f));
    if (!input) return null;
    // If already mp3, return as-is
    if (input.endsWith(".mp3")) return input;
    // Convert to MP3 with FFmpeg
    await execFileAsync(
      "ffmpeg",
      ["-i", input, "-codec:a", "libmp3lame", "-q:a", "2", outputFile, "-y"],
      {
        timeout: 60_000,
      },
    );
    if (existsSync(outputFile)) return outputFile;
    return null;
  } catch {
    return null;
  }
}

// ─── yt-dlp Download ────────────────────────────────────────────────

async function ytDlpDownload(
  url: string,
  format: "mp3" | "mp4",
): Promise<ScraperResult<YouTubeData>> {
  try {
    const ytDlpPath = findYtDlp();
    const cookiesFile = findCookiesFile();
    const normalized = normalizeUrl(url);

    const args: string[] = [
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      "--no-check-certificates",
    ];

    if (cookiesFile) {
      args.push("--cookies", cookiesFile);
    }

    if (format === "mp3") {
      args.push("-f", "bestaudio[ext=m4a]/bestaudio/best");
    } else {
      args.push("-f", "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]/best");
    }

    args.push(normalized);

    const { stdout } = await execFileAsync(ytDlpPath, args, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const info = JSON.parse(stdout) as {
      title?: string;
      thumbnail?: string;
      url?: string;
      formats?: Array<{
        ext?: string;
        url?: string;
        acodec?: string;
        vcodec?: string;
        height?: number;
        filesize?: number;
        format_note?: string;
      }>;
      duration?: number;
    };

    let downloadUrl = info.url || "";
    let formatLabel = "";
    const thumbnail =
      info.thumbnail || `https://i.ytimg.com/vi/${extractVideoId(normalized)}/hqdefault.jpg`;

    if (!downloadUrl && info.formats) {
      if (format === "mp3") {
        const audio = info.formats.find(
          (f) => f.acodec && f.acodec !== "none" && (!f.vcodec || f.vcodec === "none"),
        );
        if (audio?.url) {
          downloadUrl = audio.url;
          formatLabel = `mp3 [${audio.ext || "audio"}]`;
        }
      } else {
        const video = info.formats
          .filter((f) => f.vcodec && f.vcodec !== "none" && f.height && f.height <= 720)
          .pop();
        if (video?.url) {
          downloadUrl = video.url;
          formatLabel = `mp4 [${video.height}p]`;
        }
      }
    }

    if (!downloadUrl) {
      throw new Error("No download URL in yt-dlp output");
    }

    return scraperSuccess({
      title: info.title || "Unknown",
      thumbnail,
      downloadUrl,
      format: formatLabel || (format === "mp3" ? "mp3" : "mp4"),
      ...(info.duration != null ? { duration: info.duration } : {}),
    });
  } catch {
    return scraperError("yt-dlp failed. Make sure cookies.txt exists in root project.");
  }
}

// ─── Public API ─────────────────────────────────────────────────────

const ERROR_MSG = "Error";

async function runWithFallback(
  url: string,
  format: "mp3" | "mp4",
): Promise<ScraperResult<YouTubeData>> {
  const loaders = [
    () => ytDlpDownload(url, format),
    () => loaderToDownload(url, format === "mp3" ? "mp3" : "720"),
  ];

  for (const load of loaders) {
    const result = await load();
    if (!result.status) continue;
    if (!(await isMediaUrl(result.data.downloadUrl))) continue;

    if (format === "mp3") {
      const mp3Path = await downloadAndConvertMp3(result.data.downloadUrl);
      if (mp3Path) return scraperSuccess({ ...result.data, localFile: mp3Path });
    }
    return result;
  }

  return scraperError(ERROR_MSG);
}

export const ytmp3 = (url: string) => runWithFallback(url, "mp3");
export const ytmp4 = (url: string) => runWithFallback(url, "mp4");

// ─── loader.to fallback ─────────────────────────────────────────────

async function loaderToDownload(url: string, format: string): Promise<ScraperResult<YouTubeData>> {
  try {
    const startRes = await axios.get("https://loader.to/ajax/download.php", {
      params: { format, url },
      headers: { "user-agent": UA, "x-requested-with": "XMLHttpRequest" },
      timeout: 15000,
    });

    const start = startRes.data as {
      success?: boolean;
      id?: string;
      progress_url?: string;
      title?: string;
      info?: { image?: string };
      message?: string;
    };

    if (!start.success || !start.id || !start.progress_url) {
      throw new Error(start.message || "Download initialization failed");
    }

    const progressUrl = start.progress_url;
    const title = start.title || "Unknown";
    const thumbnail = start.info?.image || "";

    let downloadUrl = "";
    let formatLabel = "";

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const progRes = await axios.get(progressUrl, {
        headers: { "user-agent": UA },
        timeout: 10000,
      });

      const prog = progRes.data as {
        success?: number;
        progress?: number;
        download_url?: string;
        format?: string;
        text?: string;
      };

      if (prog.progress === 1000 && prog.download_url) {
        downloadUrl = prog.download_url;
        formatLabel = String(prog.format || "");
        break;
      }

      if (prog.success === 0 && prog.text && prog.text !== "Initialising") {
        throw new Error("Download failed");
      }
    }

    if (!downloadUrl) {
      throw new Error("Timeout: download did not finish");
    }

    return scraperSuccess({
      title,
      thumbnail,
      downloadUrl,
      format: formatLabel,
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}
