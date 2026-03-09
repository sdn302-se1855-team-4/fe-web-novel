const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  removeTokens,
} from "./auth";

interface ZodErrorDetail {
  path: (string | number)[];
  message: string;
}

export class ApiRequestError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiRequestError";
  }
}

// Prevent multiple refresh calls at the same time
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!res.ok) return false;

    const json = await res.json();
    const data = json.data ?? json;

    if (data.accessToken && data.refreshToken) {
      // Preserve the current role when refreshing tokens
      const { getUserRole } = await import("./auth");
      const currentRole = getUserRole();
      setTokens(data.accessToken, data.refreshToken, currentRole);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) return refreshPromise;

  refreshPromise = tryRefreshToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string | null },
): Promise<T> {
  const { token: providedToken, ...fetchOptions } = options ?? {};

  // Use provided token, or fall back to stored access token
  const token = providedToken ?? getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  // If 401 and we have a refresh token, try to refresh and retry
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry the original request with the new token
      const newToken = getAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
      }

      const retryRes = await fetch(`${API_BASE}${path}`, {
        ...fetchOptions,
        headers,
      });

      if (!retryRes.ok) {
        const errorBody = await retryRes.json().catch(() => ({
          message: retryRes.statusText,
          statusCode: retryRes.status,
        }));
        throw new ApiRequestError(
          parseErrorMessage(errorBody) || "API Error",
          retryRes.status,
        );
      }

      const json = await retryRes.json();
      return json.data !== undefined ? json.data : json;
    }

    // Refresh failed — clear tokens and redirect to login
    removeTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiRequestError("Phiên đăng nhập đã hết hạn", 401);
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({
      message: res.statusText,
      statusCode: res.status,
    }));
    throw new ApiRequestError(
      parseErrorMessage(errorBody) || "API Error",
      res.status,
    );
  }

  const json = await res.json();
  // Backend wraps responses in { data, message, statusCode }
  return json.data !== undefined ? json.data : json;
}

function parseErrorMessage(errorBody: Record<string, unknown>): string {
  if (errorBody.errors && Array.isArray(errorBody.errors)) {
    // Nestjs-zod validation errors
    return (errorBody.errors as ZodErrorDetail[])
      .map((e) => `${e.path?.join(".")}: ${e.message}`)
      .join(", ");
  }
  if (Array.isArray(errorBody.message)) {
    // Default NestJS validation errors
    return (errorBody.message as string[]).join(", ");
  }
  return errorBody.message as string;
}
