import type { ApiMessage, ApiResponse } from "../entrypoints/background";

const BASE_URL = import.meta.env.WXT_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isContentScript(): boolean {
  return typeof chrome !== "undefined" &&
    chrome.runtime?.id !== undefined &&
    typeof window !== "undefined" &&
    !window.location.href.startsWith("chrome-extension://");
}

async function sendViaBackground<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const message: ApiMessage = { type: "api-request", method, path, body };
  const response: ApiResponse = await chrome.runtime.sendMessage(message);

  if (!response.ok) {
    const errorMessage =
      (response.data as { error?: string })?.error ?? `Request failed: ${response.status}`;
    throw new ApiError(errorMessage, response.status);
  }

  return response.data as T;
}

async function directRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const responseBody = await response.json().catch(() => ({}));
    const message =
      (responseBody as { error?: string }).error ?? `Request failed: ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export function get<T>(path: string): Promise<T> {
  if (isContentScript()) {
    return sendViaBackground<T>("GET", path);
  }
  return directRequest<T>(path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  if (isContentScript()) {
    return sendViaBackground<T>("POST", path, body);
  }
  return directRequest<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}
