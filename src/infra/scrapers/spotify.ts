import axios from "axios";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

const UA = "Mozilla/5.0 (X11; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0";

export interface SpotifyData {
  title: string;
  artist: string;
  album: string;
  duration: string;
  cover: string;
  downloadUrl: string;
}

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  artists: string[];
  album: string;
  url: string;
  thumbnail: string;
  duration: string;
  durationMs: number;
  explicit: boolean;
}

export interface SpotifySearchResult {
  query: string;
  total: number;
  tracks: SpotifyTrack[];
}

export async function spotify(url: string): Promise<ScraperResult<SpotifyData>> {
  try {
    const res = await axios.post(
      "https://musicfab.io/api/spotify",
      { url },
      {
        headers: {
          accept: "*/*",
          "content-type": "application/json",
          origin: "https://musicfab.io",
          referer: "https://musicfab.io/",
          "user-agent": UA,
        },
      },
    );

    const meta = res.data?.data?.metadata;
    if (!meta?.name) throw new Error("Track not found");

    return scraperSuccess({
      title: meta.name || "",
      artist: meta.artist || "",
      album: meta.album || "",
      duration: meta.duration || "",
      cover: meta.image || "",
      downloadUrl: meta.download || "",
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}

export async function spotifySearch(
  query: string,
  limit = 5,
): Promise<ScraperResult<SpotifySearchResult>> {
  try {
    const res = await axios.get("https://spotify.xwolf.space/api/search", {
      params: { q: query, type: "track", limit },
      headers: { "user-agent": UA },
    });

    const data = res.data;
    if (!data?.success) throw new Error("Search failed");

    const tracks: SpotifyTrack[] = (data.results || []).map((t: Record<string, unknown>) => ({
      id: t.id || "",
      title: t.title || "",
      artist: t.artist || "",
      artists: t.artists || [],
      album: t.album || "",
      url: t.url || "",
      thumbnail: t.thumbnail || "",
      duration: t.duration || "",
      durationMs: t.duration_ms || 0,
      explicit: t.explicit || false,
    }));

    return scraperSuccess({
      query: data.query || query,
      total: data.total || 0,
      tracks,
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}
