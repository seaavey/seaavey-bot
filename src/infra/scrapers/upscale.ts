import axios from "axios";
import * as cheerio from "cheerio";

import type { ScraperResult } from "./index";
import { scraperError, scraperSuccess } from "./index";

export interface UpscaleData {
  buffer: Buffer;
  scale: number;
  server: string;
}

const SERVERS = [
  "api1g",
  "api2g",
  "api3g",
  "api8g",
  "api9g",
  "api10g",
  "api11g",
  "api12g",
  "api13g",
  "api14g",
  "api15g",
  "api16g",
  "api17g",
  "api18g",
  "api19g",
  "api20g",
  "api21g",
  "api22g",
  "api24g",
  "api25g",
];

const TASK =
  "r68zl88mq72xq94j2d5p66bn2z9lrbx20njsbw2qsAvgmzr11lvfhAx9kl87pp6yqgx7c8vg7sfbqnrr42qb16v0gj8jl5s0kq1kgp26mdyjjspd8c5A2wk8b4Adbm6vf5tpwbqlqdr8A9tfn7vbqvy28ylphlxdl379psxpd8r70nzs3sk1";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function getToken() {
  const html = await axios.get("https://www.iloveimg.com/upscale-image");
  const $ = cheerio.load(html.data);

  const script = $("script")
    .filter((_, el) => $(el).html()?.includes("ilovepdfConfig =") ?? false)
    .html();

  if (!script) throw new Error("Failed to get script config");

  const jsonS = script.split("ilovepdfConfig = ")[1]?.split(";")[0];
  if (!jsonS) throw new Error("Failed to parse config");
  const json = JSON.parse(jsonS) as { token?: string };
  const csrf = $("meta[name='csrf-token']").attr("content") ?? "";

  if (!json.token || !csrf) throw new Error("Failed to get token or CSRF");

  return { token: json.token, csrf };
}

async function uploadImage(
  server: string,
  headers: Record<string, string>,
  buffer: Buffer,
  task: string,
) {
  const form = new FormData();
  form.append("name", "image.jpg");
  form.append("chunk", "0");
  form.append("chunks", "1");
  form.append("task", task);
  form.append("preview", "1");
  const blob = new Blob([buffer], { type: "image/jpeg" });
  form.append("file", blob, "image.jpg");

  const res = await axios.post(`https://${server}.iloveimg.com/v1/upload`, form, {
    headers,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const serverFilename: string | undefined = res.data?.server_filename;
  if (!serverFilename) throw new Error("Upload failed");
  return { server_filename: serverFilename };
}

export async function upscaleImage(
  imageBuffer: Buffer,
  scale: 2 | 4 = 4,
): Promise<ScraperResult<UpscaleData>> {
  try {
    const { token, csrf } = await getToken();

    const serverIdx = Math.floor(Math.random() * SERVERS.length);
    const server: string = SERVERS[serverIdx] as string;

    const headers = {
      Authorization: "Bearer " + token,
      Origin: "https://www.iloveimg.com/",
      Cookie: "_csrf=" + csrf,
      "User-Agent": UA,
    };

    const upload = await uploadImage(server, headers, imageBuffer, TASK);

    const form = new FormData();
    form.append("task", TASK);
    form.append("server_filename", upload.server_filename);
    form.append("scale", String(scale));

    const res = await axios.post(`https://${server}.iloveimg.com/v1/upscale`, form, {
      headers,
      responseType: "arraybuffer",
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120_000,
    });

    if (!res.data) throw new Error("No data");

    const buffer = Buffer.isBuffer(res.data) ? res.data : Buffer.from(res.data);
    return scraperSuccess({ buffer, scale, server });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return scraperError(err.message || "Unknown error");
  }
}
