import { describe, expect, it, mock } from "bun:test";
import { spotify, spotifySearch } from "../spotify";
import type { SpotifyHttpClient } from "../spotify";

function createSpotifyClient(): SpotifyHttpClient {
  const tracks = [
    createTrack("1", "Faded", "Alan Walker"),
    createTrack("2", "Alone", "Alan Walker"),
    createTrack("3", "The Spectre", "Alan Walker"),
  ];

  return {
    post: mock(async (_url: string, data?: unknown) => {
      const url = getPostUrl(data);
      if (url.includes("invalid-url.com")) throw new Error("Track not found");

      return {
        data: {
          data: {
            metadata: {
              name: "Mock Track",
              artist: "Mock Artist",
              album: "Mock Album",
              duration: "3:21",
              image: "https://example.com/cover.jpg",
              download: "https://example.com/track.mp3",
            },
          },
        },
      };
    }),
    get: mock(async (_url: string, config?: unknown) => {
      const limit = getSearchLimit(config);

      return {
        data: {
          success: true,
          query: "Alan Walker",
          total: tracks.length,
          results: tracks.slice(0, limit),
        },
      };
    }),
  };
}

function createTrack(id: string, title: string, artist: string) {
  return {
    id,
    title,
    artist,
    artists: [artist],
    album: "Mock Album",
    url: `https://open.spotify.com/track/${id}`,
    thumbnail: "https://example.com/thumb.jpg",
    duration: "3:21",
    duration_ms: 201000,
    explicit: false,
  };
}

function getPostUrl(data: unknown): string {
  if (!isRecord(data)) return "";
  return typeof data.url === "string" ? data.url : "";
}

function getSearchLimit(config: unknown): number {
  if (!isRecord(config) || !isRecord(config.params)) return 5;
  return typeof config.params.limit === "number" ? config.params.limit : 5;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

describe("spotify", () => {
  it("should return track info from URL", async () => {
    const result = await spotify(
      "https://open.spotify.com/track/1fDFHXcykq4iw8Gg7s5hG9",
      createSpotifyClient(),
    );

    expect(result.status).toBe(true);
    expect(result.data.title).toBe("Mock Track");
    expect(result.data.artist).toBe("Mock Artist");
    expect(result.data.downloadUrl).toBe("https://example.com/track.mp3");
  }, 30000);

  it("should return error for invalid URL", async () => {
    const result = await spotify("https://invalid-url.com/track", createSpotifyClient());

    expect(result.status).toBe(false);
    expect(result.error).toBeDefined();
  }, 30000);
});

describe("spotifySearch", () => {
  it("should search tracks by query", async () => {
    const result = await spotifySearch("Faded Alan Walker", 3, createSpotifyClient());

    expect(result.status).toBe(true);
    expect(result.data).toHaveProperty("query");
    expect(result.data).toHaveProperty("total");
    expect(result.data).toHaveProperty("tracks");
    expect(result.data.tracks.length).toBeGreaterThan(0);
    expect(result.data.tracks[0]).toHaveProperty("title");
    expect(result.data.tracks[0]).toHaveProperty("artist");
    expect(result.data.tracks[0]).toHaveProperty("url");
  }, 30000);

  it("should handle limit parameter", async () => {
    const result = await spotifySearch("Alan Walker", 2, createSpotifyClient());

    expect(result.status).toBe(true);
    expect(result.data.tracks.length).toBeLessThanOrEqual(2);
  }, 30000);
});
