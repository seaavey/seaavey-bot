import axios from "axios";

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

export interface RemoveBgData {
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

    if (status === 2) return result;
    if (status === 3 || (typeof status === "number" && status < 0)) {
      throw new Error(result.error || "Unknown error");
    }

    await sleep(interval);
  }
  throw new Error(`Timeout setelah ${timeout / 1000}s`);
}

/**
 * Remove background from image buffer using EzRemove API (free, no API key).
 */
export async function removeBackground(
  imageBuffer: Buffer,
  filename = "image.jpg",
): Promise<ScraperResult<RemoveBgData>> {
  try {
    // Step 1: Init
    await axios.get(`${BASE_URL}/common/utils/get-extra-info`, {
      headers: { ...HEADERS, "content-type": "application/json; charset=UTF-8" },
    });

    // Step 2: NSFW detect
    const nsfwForm = new FormData();
    const nsfwBlob = new Blob([imageBuffer], { type: "image/jpeg" });
    nsfwForm.append("images", nsfwBlob, filename);

    const nsfwCreate = await axios.post(`${BASE_URL}/common/utils/nsfw-detect-create`, nsfwForm, {
      headers: HEADERS,
    });

    const nsfwJobId = nsfwCreate.data?.result?.job_id || nsfwCreate.data?.job_id;
    if (nsfwJobId) {
      await pollJob(`${BASE_URL}/common/utils/nsfw-detect-job/${nsfwJobId}`);
    }

    // Step 3: BG remove
    const bgForm = new FormData();
    const bgBlob = new Blob([imageBuffer], { type: "image/jpeg" });
    bgForm.append("image_file", bgBlob, filename);
    bgForm.append("mode", "general_v2");
    bgForm.append("task_mode", "free");

    const bgCreate = await axios.post(
      `${BASE_URL}/ez-remove/v3/background-remove/create-job`,
      bgForm,
      {
        headers: { ...HEADERS, "product-serial": SERIAL },
      },
    );

    if (bgCreate.data.code !== 100000) {
      throw new Error(`BG create-job failed: ${JSON.stringify(bgCreate.data)}`);
    }

    const bgJobId = bgCreate.data.result.job_id;

    // Step 4: Poll result
    const finalResult = await pollJob(
      `${BASE_URL}/ez-remove/v3/background-remove/get-job/${bgJobId}`,
      { "product-serial": SERIAL },
    );

    const downloadUrl =
      finalResult.image_url ||
      finalResult.result_url ||
      finalResult.output?.preview?.[0] ||
      finalResult.output?.url ||
      finalResult.preview_url;

    if (!downloadUrl) throw new Error(`URL not found: ${JSON.stringify(finalResult)}`);

    // Step 5: Download result
    const res = await axios.get(downloadUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.isBuffer(res.data) ? res.data : Buffer.from(res.data);

    return scraperSuccess({ buffer });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}
