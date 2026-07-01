export const isDev = process.env.NODE_ENV !== "production";

interface Config {
  name: string;
  prefix: string[];
  owner: string[];
  accessMode: "public" | "private" | "self";
}

export const config: Config = {
  name: "SeaaveyBot",
  prefix: (process.env.PREFIX ?? ".").split(","),
  owner: (process.env.OWNER_NUMBER ?? "62123456789").split(","),
  accessMode: (process.env.ACCESS_MODE ?? "public") as Config["accessMode"],
};
