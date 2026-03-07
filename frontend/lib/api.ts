// frontend/lib/api.ts
// FIX (Issue 4 — Auth refresh ERR_CONNECTION_REFUSED):
//   The original interceptor used a raw `axios.post(...)` with an explicit
//   `${API_BASE_URL}/api/auth/refresh` URL.  When NEXT_PUBLIC_API_URL is
//   undefined in some environments the URL resolved to "undefined/api/auth/refresh",
//   causing ERR_CONNECTION_REFUSED.
//
//   Fix: use the shared `api` instance for the refresh call so baseURL is
//   always resolved from the same source as every other request.
//   We use a fresh axios instance (refreshApi) to avoid the response
//   interceptor re-entering itself during the refresh attempt.

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse
} from "axios";

import { authStore } from "@/store/authStore";

interface TokenExpiredResponse {
  code: "TOKEN_EXPIRED";
  message: string;
}

interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// FIX: guard against missing env var — fall back to same origin so
// the browser resolves /api/* correctly in both dev and prod.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Dedicated instance for the refresh call — no interceptors attached,
// so a failed refresh doesn't loop back into itself.
const refreshApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: { "Content-Type": "application/json" }
});

// ─────────────────────────────────────────────
// Request interceptor
// ─────────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStore.getState().accessToken;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(normalizeError(error))
);

// ─────────────────────────────────────────────
// Refresh Token Queue
// ─────────────────────────────────────────────

let isRefreshing = false;

let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else if (token) p.resolve(token);
  });

  failedQueue = [];
};

// ─────────────────────────────────────────────
// Response interceptor
// ─────────────────────────────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError<TokenExpiredResponse>) => {
    const originalRequest = error.config as RetryAxiosRequestConfig;

    // TOKEN EXPIRED
    if (
      error.response?.status === 401 &&
      error.response.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest?._retry
    ) {
      const url = originalRequest?.url ?? ""
  if (url.includes("/api/auth/login") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/refresh")) {
    authStore.getState().logout()
    return Promise.reject(normalizeError(error))
  }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // FIX: use refreshApi (dedicated instance, no interceptors)
        // so baseURL is resolved from NEXT_PUBLIC_API_URL, not hard-coded.
        const res = await refreshApi.post<RefreshResponse>(
          "/api/auth/refresh",
          {}
        );

        const newToken = res.data?.data?.accessToken;

        if (!newToken) throw new Error("Invalid refresh response");

        authStore.getState().setAccessToken(newToken);

        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(originalRequest);

      } catch (refreshError) {

        processQueue(refreshError, null);

        authStore.getState().logout();

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(normalizeError(refreshError));

      } finally {
        isRefreshing = false;
      }
    }

    // Retry once for transient network issues
    if (!originalRequest?._retry && !error.response) {
      originalRequest._retry = true;
      return api(originalRequest);
    }

    return Promise.reject(normalizeError(error));
  }
);

// ─────────────────────────────────────────────
// Error Normalizer
// ─────────────────────────────────────────────

function normalizeError(error: any) {

  if (axios.isAxiosError(error)) {

    return {
      message:
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Request failed",

      status: error.response?.status ?? 500
    };

  }

  return {
    message: "Unexpected error",
    status: 500
  };
}