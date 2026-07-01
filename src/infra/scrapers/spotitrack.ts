/**
 * Spotify Track & Playlist Downloader
 * Base : https://spotitrack.com
 * Source : https://onlym.eu.cc/dl-spotitrack.js
 * Author : ONLym-Api
 * Note : Supports Track or Playlist download via Event-Stream (SSE).
 */

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
const HOST = "spotitrack.com";
const BASE = `https://${HOST}`;

export interface SpotitrackTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  thumbnail: string;
  fileSize: string;
  buffer: Buffer;
}

export interface SpotitrackPlaylist {
  title: string;
  trackCount: number;
  thumbnail: string;
  downloadUrl: string;
}

async function getActionToken(): Promise<string> {
  const res = await fetch(BASE, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error("Gagal memuat halaman utama untuk sinkronisasi token.");
  const html = await res.text();
  // ponytail: fragile regex — upstream might change inline script shape; upgrade to cheerio if it breaks often
  const match = html.match(/"action"\s*:\s*"([a-f0-9]{40})"/i);
  return match?.[1] ?? "40140d41ab0803c936eac316edb1fbc6b036e5478f";
}

export async function spotitrackTrack(url: string): Promise<ScraperResult<SpotitrackTrack>> {
  try {
    const token = await getActionToken();

    const actionRes = await fetch(BASE, {
      method: "POST",
      headers: {
        accept: "text/x-component",
        "accept-language": "en-US,en;q=0.9,id;q=0.8",
        "content-type": "text/plain;charset=UTF-8",
        "next-action": token,
        "next-router-state-tree":
          "%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22PAGE%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D",
        origin: BASE,
        referer: `${BASE}/`,
        "user-agent": UA,
      },
      body: JSON.stringify([url]),
    });

    if (!actionRes.ok) throw new Error(`Server Action HTTP Error: ${actionRes.status}`);

    const rawText = await actionRes.text();
    const line = rawText.split("\n").find((l) => l.startsWith("1:"));
    if (!line) throw new Error("Gagal mengekstrak metadata dari server stream.");

    const parsed = JSON.parse(line.slice(2));
    if (!parsed.success || !parsed.data)
      throw new Error(parsed.message || "Tautan Spotify Track tidak valid.");

    const info = parsed.data;
    const artist = Array.isArray(info.artists) ? info.artists.join(", ") : String(info.artists);

    const audioRes = await fetch(`${BASE}/api/proxy/download`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "content-type": "application/json",
        origin: BASE,
        referer: `${BASE}/`,
        "user-agent": UA,
      },
      body: JSON.stringify({
        url,
        quality: "128",
        title: info.name,
        artist,
        imageUrl: info.image,
      }),
    });

    if (!audioRes.ok) throw new Error(`API Download merespons status: ${audioRes.status}`);

    const buffer = Buffer.from(await audioRes.arrayBuffer());

    return scraperSuccess({
      id: info.id,
      title: info.name,
      artist,
      album: info.album,
      durationMs: info.duration,
      thumbnail: info.image,
      fileSize: `${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
      buffer,
    });
  } catch (e: unknown) {
    return scraperError((e as Error).message || "Unknown error");
  }
}

export async function spotitrackPlaylist(url: string): Promise<ScraperResult<SpotitrackPlaylist>> {
  try {
    const token = await getActionToken();

    const actionRes = await fetch(BASE, {
      method: "POST",
      headers: {
        accept: "text/x-component",
        "content-type": "text/plain;charset=UTF-8",
        "next-action": token,
        "user-agent": UA,
      },
      body: JSON.stringify([url]),
    });

    const rawText = await actionRes.text();
    const line = rawText.split("\n").find((l) => l.startsWith("1:"));
    if (!line) throw new Error("Gagal mengekstrak metadata playlist.");

    const parsed = JSON.parse(line.slice(2));
    if (!parsed.success || !parsed.data)
      throw new Error(parsed.message || "Tautan Playlist tidak valid.");

    const meta = parsed.data;
    const qs = new URLSearchParams({
      url,
      quality: "128",
      title: meta.name || "My Playlist",
      trackCount: String(meta.trackCount || 0),
      imageUrl: meta.image || "",
    });

    const sseRes = await fetch(`${BASE}/api/proxy/playlist?${qs}`, {
      headers: { accept: "text/event-stream", "user-agent": UA },
    });

    if (!sseRes.ok) throw new Error(`Gagal memproses stream playlist: ${sseRes.status}`);

    const body = sseRes.body;
    if (!body) throw new Error("Response body stream is null.");

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let downloadUrl = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      for (const raw of decoder.decode(value, { stream: true }).split("\n")) {
        let line = raw.trim();
        if (line.startsWith("data:")) line = line.replace(/^data:\s*/, "");
        if (line.startsWith("{")) {
          try {
            const evt = JSON.parse(line);
            if (evt.status === "complete" && evt.download_url) {
              downloadUrl = evt.download_url;
            }
          } catch {
            /* skip malformed JSON chunks */
          }
        }
      }
    }

    if (!downloadUrl) throw new Error("Gagal mendapatkan link download ZIP dari event-stream.");

    return scraperSuccess({
      title: meta.name,
      trackCount: meta.trackCount,
      thumbnail: meta.image,
      downloadUrl,
    });
  } catch (e: unknown) {
    return scraperError((e as Error).message || "Unknown error");
  }
}
