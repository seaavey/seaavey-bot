import { config } from "@/core/config";

const BASE_URL = "https://api.seaavey.com";

interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
  path: string;
}

interface ApiError {
  success: false;
  statusCode: number;
  requestId: string;
  error: string;
  timestamp: string;
  path: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { "X-API-KEY": config.apiKey, ...options?.headers },
  });
  if (!res.ok) {
    const err = (await res.json()) as ApiError;
    throw new Error(err.error);
  }
  return res.json() as Promise<ApiResponse<T>>;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};
