export interface ScraperResult<T> {
  status: boolean;
  data: T;
  error?: string;
}

export function scraperSuccess<T>(data: T): ScraperResult<T> {
  return { status: true, data };
}

export function scraperError<T>(error: string): ScraperResult<T> {
  return { status: false, data: [] as T, error };
}

export { fsaver } from "./fbdl";
export { instagramDl } from "./instagram";
export { pinterestDl, pinterestSearch } from "./pinterest";
export { soundcloudDl, soundcloudSearch } from "./soundcloud";
export { threadsDl } from "./threads";
export { spotify, spotifySearch } from "./spotify";
export { ytmp3, ytmp4 } from "./youtube";
export { geniusSearch } from "./genius";
export { mediafireDl } from "./mediafire";
export { twitterDl } from "./twitter";
export { sswebDl } from "./ssweb";
export { upscaleImage } from "./upscale";
export { removeBackground } from "./removebg";
export { akinatorStart, akinatorAnswer, akinatorExclude } from "./akinator";
export { removeWatermark } from "./removewm";
