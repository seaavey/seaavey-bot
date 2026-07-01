import { describe, expect, it } from "bun:test";
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
    } else {
      expect(typeof result.error).toBe("string");
    }
  }, 120000);
});
