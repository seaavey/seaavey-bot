import axios from "axios";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let cachedClientId: string | null = null;

async function getClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;

  const res = await axios.get<string>("https://soundcloud.com", {
    headers: { "user-agent": UA },
    timeout: 15000,
  });

  const match = res.data.match(/window\.__sc_hydration\s*=\s*(\[.*?\]);/);

  if (!match?.[1]) throw new Error("Failed to get Client ID");

  const hydration = JSON.parse(match[1]) as Array<{
    hydratable: string;
    data: { id?: string };
  }>;

  const apiClient = hydration.find((h) => h.hydratable === "apiClient");
  const id = apiClient?.data?.id;

  if (!id) throw new Error("Client ID not found");

  cachedClientId = id;
  return id;
}

export interface SoundCloudTrack {
  id: number;
  title: string;
  artist: string;
  duration: string;
  url: string;
  artwork: string | null;
  streamUrl: string;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export interface SoundCloudSearchResult {
  query: string;
  total: number;
  tracks: SoundCloudTrack[];
}

export async function soundcloudSearch(
  query: string,
  limit = 5,
): Promise<ScraperResult<SoundCloudSearchResult>> {
  try {
    const clientId = await getClientId();

    const res = await axios.get("https://api-v2.soundcloud.com/search/tracks", {
      params: { q: query, client_id: clientId, limit },
      headers: { "user-agent": UA },
      timeout: 15000,
    });

    const collection = (res.data?.collection ?? []) as Array<{
      id: number;
      title: string;
      user?: { username?: string };
      duration?: number;
      permalink_url?: string;
      artwork_url?: string | null;
      media?: {
        transcodings?: Array<{
          url: string;
          format?: { protocol?: string; mime_type?: string };
        }>;
      };
    }>;

    const tracks: SoundCloudTrack[] = collection.map((t) => {
      const progressive = t.media?.transcodings?.find(
        (tr) => tr.format?.protocol === "progressive",
      );

      return {
        id: t.id,
        title: t.title || "",
        artist: t.user?.username || "",
        duration: formatDuration(t.duration ?? 0),
        url: t.permalink_url || "",
        artwork: t.artwork_url || null,
        streamUrl: progressive ? `${progressive.url}?client_id=${clientId}` : "",
      };
    });

    return scraperSuccess({
      query,
      total: res.data?.total_results ?? 0,
      tracks,
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}

export async function soundcloudDl(url: string): Promise<ScraperResult<SoundCloudTrack>> {
  try {
    const clientId = await getClientId();

    const res = await axios.get("https://api-v2.soundcloud.com/resolve", {
      params: { url, client_id: clientId },
      headers: { "user-agent": UA },
      timeout: 15000,
    });

    const track = res.data as {
      id?: number;
      title?: string;
      user?: { username?: string };
      duration?: number;
      permalink_url?: string;
      artwork_url?: string | null;
      media?: {
        transcodings?: Array<{
          url: string;
          format?: { protocol?: string; mime_type?: string };
        }>;
      };
    };

    if (!track?.id) throw new Error("Track not found");

    const progressive = track.media?.transcodings?.find(
      (tr) => tr.format?.protocol === "progressive",
    );

    return scraperSuccess({
      id: track.id,
      title: track.title || "",
      artist: track.user?.username || "",
      duration: formatDuration(track.duration ?? 0),
      url: track.permalink_url || url,
      artwork: track.artwork_url || null,
      streamUrl: progressive ? `${progressive.url}?client_id=${clientId}` : "",
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}
