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
  status?: number;
  error?: string;
  image_url?: string;
  result_url?: string;
  output?: string[] | string;
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

    if (raw.code === 100000) return result;
    if (raw.code !== 300001) {
      throw new Error(raw.message?.en || raw.message || result?.error || "Unknown error");
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
      throw new Error(t("scraper.removewm.createJobFailed", { data: JSON.stringify(create.data) }));
    }

    const jobId = create.data.result.job_id;

    const finalResult = await pollJob(`${BASE_URL}/ez-remove/watermark-remove/get-job/${jobId}`, {
      "product-serial": SERIAL,
    });

    const downloadUrl =
      finalResult.image_url ||
      finalResult.result_url ||
      (Array.isArray(finalResult.output) ? finalResult.output[0] : finalResult.output) ||
      finalResult.preview_url;

    if (!downloadUrl) {
      throw new Error(t("scraper.removewm.noUrl", { result: JSON.stringify(finalResult) }));
    }

    const res = await axios.get(downloadUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.isBuffer(res.data) ? res.data : Buffer.from(res.data);

    return scraperSuccess({ buffer });
  } catch (e: unknown) {
    const errMessage = e instanceof Error ? e.message : String(e);
    return scraperError(errMessage);
  }
}
