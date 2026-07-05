import { describe, expect, it, mock } from "bun:test";
import { spotitrackTrack, spotitrackPlaylist } from "../spotitrack";
import type { SpotitrackFetcher } from "../spotitrack";

const TRACK_URL = "https://open.spotify.com/track/1fDFHXcykq4iw8Gg7s5hG9";
const PLAYLIST_URL = "https://open.spotify.com/playlist/45DwXpZc4Hfcp6x71Z5Mo7";
const BASE = "https://spotitrack.com";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

function createSpotitrackFetch(): SpotitrackFetcher {
  return mock(async (input: FetchInput, init?: FetchInit): Promise<Response> => {
    const url = getRequestUrl(input);
    const method = init?.method ?? getRequestMethod(input);

    if (url === BASE && method === "GET") {
      return new Response('"action":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"');
    }

    if (url === BASE && method === "POST") {
      return createActionResponse(String(init?.body ?? ""));
    }

    if (url === `${BASE}/api/proxy/download` && method === "POST") {
      return new Response(Buffer.from("mock-audio-buffer"));
    }

    if (url.startsWith(`${BASE}/api/proxy/playlist`)) {
      return new Response(createPlaylistStream(), {
        headers: { "content-type": "text/event-stream" },
      });
    }

    return new Response("not found", { status: 404 });
  });
}

function getRequestUrl(input: FetchInput): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function getRequestMethod(input: FetchInput): string {
  if (input instanceof Request) return input.method;
  return "GET";
}

function createActionResponse(body: string): Response {
  if (body.includes(PLAYLIST_URL)) {
    return new Response(
      `1:${JSON.stringify({
        success: true,
        data: {
          name: "Mock Playlist",
          trackCount: 2,
          image: "https://example.com/playlist.jpg",
        },
      })}`,
    );
  }

  return new Response(
    `1:${JSON.stringify({
      success: true,
      data: {
        id: "1fDFHXcykq4iw8Gg7s5hG9",
        name: "Mock Track",
        artists: ["Mock Artist"],
        album: "Mock Album",
        duration: 123456,
        image: "https://example.com/track.jpg",
      },
    })}`,
  );
}

function createPlaylistStream(): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      const event = { status: "complete", download_url: "https://example.com/playlist.zip" };
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
      controller.close();
    },
  });
}

describe("spotitrackTrack", () => {
  it(
    "should download track from spotitrack",
    async () => {
      const res = await spotitrackTrack(TRACK_URL, createSpotitrackFetch());

      expect(res.status).toBe(true);
      expect(res.data.title).toBe("Mock Track");
      expect(res.data.artist).toBe("Mock Artist");
      expect(res.data.album).toBe("Mock Album");
      expect(res.data.fileSize).toBeString();
      expect(res.data.buffer).toBeInstanceOf(Buffer);
      expect(res.data.buffer.length).toBeGreaterThan(0);
    },
    { timeout: 120000 },
  );
});

describe("spotitrackPlaylist", () => {
  it(
    "should get playlist download URL",
    async () => {
      const res = await spotitrackPlaylist(PLAYLIST_URL, createSpotitrackFetch());

      expect(res.status).toBe(true);
      expect(res.data.title).toBe("Mock Playlist");
      expect(res.data.trackCount).toBe(2);
      expect(res.data.downloadUrl).toBe("https://example.com/playlist.zip");
    },
    { timeout: 120000 },
  );
});
