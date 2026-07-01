import axios from "axios";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

export interface GeniusResult {
  title: string;
  artist: string;
  album: string;
  year: number;
  url: string;
  image: string;
}

export interface GeniusLyrics {
  title: string;
  artist: string;
  album: string;
  year: number;
  url: string;
  image: string;
  lyrics: string;
}

/**
 * Search songs via lrclib.net (Genius is blocked by Cloudflare).
 */
export async function geniusSearch(
  query: string,
  limit = 5,
): Promise<ScraperResult<GeniusResult[]>> {
  try {
    const { data } = await axios.get(
      `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`,
      {
        headers: { "user-agent": UA },
        timeout: 30_000,
      },
    );

    const items = Array.isArray(data) ? data : [];
    const results: GeniusResult[] = items.slice(0, limit).map((r: Record<string, unknown>) => ({
      title: String(r.trackName || ""),
      artist: String(r.artistName || ""),
      album: String(r.albumName || ""),
      year: Number(String(r.releaseDate || "").slice(0, 4) || 0),
      url: String(r.url || ""),
      image: String(r.albumCover || ""),
    }));

    if (!results.length) throw new Error("Song not found");
    return scraperSuccess(results);
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}

/**
 * Get lyrics from lrclib.net by artist + track name.
 */
export async function geniusLyrics(
  artist: string,
  track: string,
  album?: string,
): Promise<ScraperResult<GeniusLyrics>> {
  try {
    const params: Record<string, string> = {
      artist_name: artist,
      track_name: track,
    };
    if (album) params.album_name = album;

    const res = await axios.get("https://lrclib.net/api/get", {
      params,
      headers: { "user-agent": UA },
      timeout: 30_000,
    });
    const d = res.data as Record<string, unknown>;

    const lyrics = String(d.plainLyrics || "");
    if (!lyrics) throw new Error("Lyrics not found");

    return scraperSuccess({
      title: String(d.trackName || ""),
      artist: String(d.artistName || ""),
      album: String(d.albumName || ""),
      year: Number(String(d.releaseDate || "").slice(0, 4) || 0),
      url: String(d.url || ""),
      image: String(d.albumCover || ""),
      lyrics,
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}
