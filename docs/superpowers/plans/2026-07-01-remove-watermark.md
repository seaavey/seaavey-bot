# Watermark Removal Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a new command `.removewm` / `.removewatermark` that removes watermarks from images using the `ezremove.ai` API.

**Architecture:** A command in `src/commands/media/removewm.ts` downloads user images and delegates processing to a scraper in `src/infra/scrapers/removewm.ts`. The scraper polls the `ezremove.ai` API and returns the processed image as a buffer.

**Tech Stack:** Bun, Axios, Baileys (v7)

## Global Constraints

- **Language Support**: Both `id.json` and `en.json` must be updated consistently.
- **TypeScript Strictness**: Use `import type` for type-only imports (`verbatimModuleSyntax: true`).
- **Code Style**: Avoid `any` types; strictly handle undefined/null properties. Ensure files are formatted and linted properly.

---

### Task 1: Add Localization/Translation Keys

**Files:**

- Modify: `src/data/lang/en.json:760-766`
- Modify: `src/data/lang/en.json:965-969`
- Modify: `src/data/lang/id.json:760-766`
- Modify: `src/data/lang/id.json:965-969`

**Interfaces:**

- Consumes: None
- Produces: Translations for `media.removewm` and `scraper.removewm` keys.

- [ ] **Step 1: Add translations to `src/data/lang/en.json`**
      Modify the `media` block (after `upscale`) and `scraper` block (after `removebg`) to include watermark removal messages.

  _Under `commands.media`:_

  ```json
      "removewm": {
        "noImage": "❌ Reply or send an image with caption .removewm",
        "processing": "⏳ Removing watermark...",
        "failed": "❌ Failed: {error}",
        "desc": "Remove watermark from an image using EzRemove"
      }
  ```

  _Under `scraper`:_

  ```json
      "removewm": {
        "createJobFailed": "Watermark remove create-job failed: {data}",
        "noUrl": "URL not found: {data}"
      }
  ```

- [ ] **Step 2: Add translations to `src/data/lang/id.json`**
      Repeat the same structure for Indonesian translations.

  _Under `commands.media`:_

  ```json
      "removewm": {
        "noImage": "❌ Balas atau kirim gambar dengan caption .removewm",
        "processing": "⏳ Menghapus watermark...",
        "failed": "❌ Gagal: {error}",
        "desc": "Menghapus watermark dari gambar menggunakan EzRemove"
      }
  ```

  _Under `scraper`:_

  ```json
      "removewm": {
        "createJobFailed": "Watermark remove create-job failed: {data}",
        "noUrl": "URL not found: {data}"
      }
  ```

- [ ] **Step 3: Run formatting/validation check**
      Run: `bun run format:check`
      Expected: JSON syntax is valid, no formatting errors.

- [ ] **Step 4: Commit**
  ```bash
  git add src/data/lang/en.json src/data/lang/id.json
  git commit -m "feat: add translation strings for removewm command"
  ```

---

### Task 2: Implement Scraper Backend

**Files:**

- Create: `src/infra/scrapers/removewm.ts`
- Modify: `src/infra/scrapers/index.ts:25-29`

**Interfaces:**

- Consumes: `t` from `@/core/translations`, `scraperError` and `scraperSuccess` from `@/infra/scrapers/index`
- Produces: `removeWatermark(imageBuffer: Buffer, filename?: string): Promise<ScraperResult<RemoveWmData>>`

- [ ] **Step 1: Write empty scraper implementation & export it**
      Create `src/infra/scrapers/removewm.ts` returning a dummy success response.

  _`src/infra/scrapers/removewm.ts`:_

  ```typescript
  import type { ScraperResult } from "./index";
  import { scraperSuccess } from "./index";

  export interface RemoveWmData {
    buffer: Buffer;
  }

  export async function removeWatermark(
    _imageBuffer: Buffer,
    _filename = "image.jpg",
  ): Promise<ScraperResult<RemoveWmData>> {
    return scraperSuccess({ buffer: Buffer.alloc(0) });
  }
  ```

  Export it in `src/infra/scrapers/index.ts`:

  ```typescript
  export { removeWatermark } from "./removewm";
  ```

- [ ] **Step 2: Write complete scraper logic**
      Replace the contents of `src/infra/scrapers/removewm.ts` with the robust Axios upload + polling logic:

  ```typescript
  import axios from "axios";
  import { t } from "@/core/translations";
  import type { ScraperResult } from "./index";
  import { scraperError, scraperSuccess } from "./index";

  const BASE_URL = "https://api.ezremove.ai/api";
  const SERIAL = "db068b9b7a108ae1c9945d10dac53dca";

  const HEADERS = {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
    "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    origin: "https://ezremove.ai",
    referer: "https://ezremove.ai/",
    accept: "*/*",
  };

  export interface RemoveWmData {
    buffer: Buffer;
  }

  interface PollJobResult {
    status: number;
    error?: string;
    image_url?: string;
    result_url?: string;
    output?: { preview?: string[]; url?: string };
    preview_url?: string;
    [key: string]: unknown;
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function pollJob(
    url: string,
    extraHeaders: Record<string, string> = {},
  ): Promise<PollJobResult> {
    const start = Date.now();
    const timeout = 90_000;
    const interval = 2000;

    while (Date.now() - start < timeout) {
      const res = await axios.get(url, {
        headers: { ...HEADERS, "content-type": "application/json; charset=UTF-8", ...extraHeaders },
      });

      const raw = res.data;
      const result = raw.result ?? raw;
      const status = result?.status;

      if (raw.code === 100000 && result?.output?.[0]) return result;
      if (status === 3 || (typeof status === "number" && status < 0)) {
        throw new Error(result.error || "Unknown error");
      }

      await sleep(interval);
    }
    throw new Error(`Timeout setelah ${timeout / 1000}s`);
  }

  export async function removeWatermark(
    imageBuffer: Buffer,
    filename = "image.jpg",
  ): Promise<ScraperResult<RemoveWmData>> {
    try {
      const form = new FormData();
      const blob = new Blob([imageBuffer], { type: "image/jpeg" });
      form.append("image_file", blob, filename);

      const create = await axios.post(`${BASE_URL}/ez-remove/watermark-remove/create-job`, form, {
        headers: { ...HEADERS, "product-serial": SERIAL },
      });

      if (create.data.code !== 100000) {
        throw new Error(
          t("scraper.removewm.createJobFailed", { data: JSON.stringify(create.data) }),
        );
      }

      const jobId = create.data.result.job_id;

      const finalResult = await pollJob(`${BASE_URL}/ez-remove/watermark-remove/get-job/${jobId}`, {
        "product-serial": SERIAL,
      });

      const downloadUrl =
        finalResult.image_url ||
        finalResult.result_url ||
        finalResult.output?.[0] ||
        finalResult.preview_url;

      if (!downloadUrl) {
        throw new Error(t("scraper.removewm.noUrl", { result: JSON.stringify(finalResult) }));
      }

      const res = await axios.get(downloadUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.isBuffer(res.data) ? res.data : Buffer.from(res.data);

      return scraperSuccess({ buffer });
    } catch (e: unknown) {
      const err = e as { message?: string };
      return scraperError(err.message || "Unknown error");
    }
  }
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add src/infra/scrapers/removewm.ts src/infra/scrapers/index.ts
  git commit -m "feat: implement removeWatermark scraper"
  ```

---

### Task 3: Test Scraper with Bun Test Suite

**Files:**

- Create: `src/infra/scrapers/__tests__/removewm.test.ts`

**Interfaces:**

- Consumes: `removeWatermark` from `@/infra/scrapers`
- Produces: Test verification

- [ ] **Step 1: Write unit test file**
      Create `src/infra/scrapers/__tests__/removewm.test.ts`:

  ```typescript
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
    }, 45000);
  });
  ```

- [ ] **Step 2: Run test suite**
      Run: `bun test src/infra/scrapers/__tests__/removewm.test.ts`
      Expected: Test passes successfully or handles API failures cleanly.

- [ ] **Step 3: Commit**
  ```bash
  git add src/infra/scrapers/__tests__/removewm.test.ts
  git commit -m "test: add unit test for removeWatermark scraper"
  ```

---

### Task 4: Implement Command Handler

**Files:**

- Create: `src/commands/media/removewm.ts`

**Interfaces:**

- Consumes: `downloadMediaMessage` from `baileys`, `defineCommand` from `@/core/types`, `removeWatermark` from `@/infra/scrapers`, `t` from `@/core/translations`
- Produces: Command registration for `.removewm`

- [ ] **Step 1: Write command file**
      Create `src/commands/media/removewm.ts`:

  ```typescript
  import { downloadMediaMessage, type WAMessage } from "baileys";
  import { t } from "@/core/translations";
  import { defineCommand } from "@/core/types";
  import { removeWatermark } from "@/infra/scrapers";

  export default defineCommand({
    name: "Remove Watermark",
    alias: ["removewm", "removewatermark", "unwm"],
    description: t("media.removewm.desc"),
    tags: ["media"],
    handler: async (sock, msg) => {
      const imageMsg = msg.message?.imageMessage || msg.quoted?.imageMessage;

      if (!imageMsg) {
        return msg.reply(t("media.removewm.noImage"));
      }

      await msg.reply(t("media.removewm.processing"));

      try {
        const message = msg.quoted
          ? ({
              key: { ...msg.key, id: msg.quoted.id, participant: msg.quoted.sender },
              message: { imageMessage: msg.quoted.imageMessage },
            } as WAMessage)
          : msg.raw;
        const buffer = (await downloadMediaMessage(message, "buffer", {
          host: "mmg.whatsapp.net",
        })) as Buffer;

        const result = await removeWatermark(buffer);

        if (!result.status) {
          return msg.reply(t("media.removewm.failed", { error: result.error || "Unknown error" }));
        }

        await sock.sendMessage(
          msg.jid,
          {
            image: result.data.buffer,
          },
          { quoted: msg.raw },
        );
      } catch (e: unknown) {
        const error = e as Error;
        await msg.reply(t("media.removewm.failed", { error: error.message }));
      }
    },
  });
  ```

- [ ] **Step 2: Verify project compilation and formatting**
      Run:

  ```bash
  bun run format
  bun run lint
  ```

  Expected: Files formatted and typescript / eslint compile successfully without errors.

- [ ] **Step 3: Commit**
  ```bash
  git add src/commands/media/removewm.ts
  git commit -m "feat: implement removewm command handler"
  ```
