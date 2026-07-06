export const isDev = process.env.NODE_ENV !== "production";

const ACCESS_MODES = ["public", "private", "self"] as const;

type AccessMode = (typeof ACCESS_MODES)[number];

interface Config {
  name: string;
  prefix: string[];
  owner: string[];
  accessMode: AccessMode;
}

function parseList(value: string | undefined, fallback: string): string[] {
  const items = (value ?? fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : [fallback];
}

function parseAccessMode(value: string | undefined): AccessMode {
  const mode = value?.trim() || "public";
  if (ACCESS_MODES.includes(mode as AccessMode)) return mode as AccessMode;

  throw new Error(`Invalid ACCESS_MODE "${mode}". Use one of: ${ACCESS_MODES.join(", ")}`);
}

export const config: Config = {
  name: "SeaaveyBot",
  prefix: parseList(process.env.PREFIX, "."),
  owner: parseList(process.env.OWNER_NUMBER, "62123456789"),
  accessMode: parseAccessMode(process.env.ACCESS_MODE),
};
