import { describe, expect, it, mock } from "bun:test";
// @ts-expect-error - bypass mock module type import
import originalAxios from "../../../../node_modules/axios";

mock.module("axios", () => {
  return {
    default: {
      ...originalAxios,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      post: mock(async (url: string, data: any, config: any) => {
        if (url.includes("/watermark-remove/create-job")) {
          return {
            data: {
              code: 100000,
              result: { job_id: "mocked-job-id" },
            },
          };
        }
        return originalAxios.post(url, data, config);
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get: mock(async (url: string, config: any) => {
        if (url.includes("/watermark-remove/get-job/")) {
          return {
            data: {
              code: 100000,
              result: {
                output: ["https://example.com/result.png"],
              },
            },
          };
        }
        if (url === "https://example.com/result.png") {
          return {
            data: Buffer.from("mocked-image-buffer"),
          };
        }
        return originalAxios.get(url, config);
      }),
    },
  };
});

import { removeWatermark } from "../index";

describe("removeWatermark", () => {
  it("should remove watermark from image", async () => {
    // Create a dummy 1x1 white JPEG image buffer in memory
    const dummyJpg = Buffer.from(
      "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
      "base64",
    );

    const result = await removeWatermark(dummyJpg);
    expect(result).toHaveProperty("status");
    expect(typeof result.status).toBe("boolean");
    if (result.status) {
      expect(result.data).toHaveProperty("buffer");
      expect(Buffer.isBuffer(result.data.buffer)).toBe(true);
      expect(result.data.buffer.toString()).toBe("mocked-image-buffer");
    } else {
      expect(typeof result.error).toBe("string");
    }
  }, 120000);
});
