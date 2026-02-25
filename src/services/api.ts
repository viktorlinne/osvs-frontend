import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { reportGlobalError } from "./globalError";
import { reportUnauthorized } from "./globalAuth";
import type { ApiError } from "../types";

const BASE_URL = import.meta.env.DEV
  ? "/api"
  : `${import.meta.env.VITE_BACKEND_URL}/api`;

// Simple axios instance. `withCredentials` is required because the
// backend stores access/refresh tokens in HTTP-only cookies.
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

type RetriableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  _unauthorizedNotified?: boolean;
};

function isAuthFlowRequest(config?: AxiosRequestConfig): boolean {
  const url = String(config?.url ?? "");
  return /\/auth\/(login|refresh|forgot-password|reset-password)\b/.test(url);
}

// Minimal refresh strategy: on first 401 we POST to `/auth/refresh`
// using the browser `fetch` API (to avoid axios interceptor recursion).
// If the refresh succeeds we retry the original request once.
api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const originalConfig = err.config as RetriableRequestConfig;
    if (!originalConfig) return Promise.reject(err);

    const status = err.response?.status;
    if (status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;
      try {
        const resp = await fetch(`${BASE_URL.replace(/\/$/, "")}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (resp.ok) {
          return api.request(originalConfig);
        }
      } catch {
        // fallthrough to reject with original error
      }
    }

    if (
      status === 401 &&
      !isAuthFlowRequest(originalConfig) &&
      !originalConfig._unauthorizedNotified
    ) {
      originalConfig._unauthorizedNotified = true;
      reportUnauthorized({
        status,
        url: String(originalConfig.url ?? ""),
        source: "axios-interceptor",
      });
    }

    return Promise.reject(err);
  }
);

// Small helper to unwrap `response.data` and normalize errors.
export async function fetchData<T = unknown>(
  req: Promise<AxiosResponse<T>>
): Promise<T> {
  try {
    const response = await req;
    const { data, config } = response;

    // Defensive: some deployments may return a 2xx with an explicit
    // error payload shape.
    if (data && typeof data === "object") {
      const rec = data as Record<string, unknown>;
      const maybeError =
        typeof rec.error === "string"
          ? rec.error
          : Array.isArray(rec.error)
          ? rec.error
              .filter((part): part is string => typeof part === "string")
              .join(", ")
          : undefined;

      if (maybeError && maybeError.length > 0) {
        const status = typeof rec.status === "number" ? rec.status : 400;
        const apiErr: ApiError = {
          status,
          code: typeof rec.code === "string" ? rec.code : undefined,
          message: maybeError,
          details: rec.details,
        };

        if (status === 401) {
          const requestConfig = config as RetriableRequestConfig;
          if (
            !isAuthFlowRequest(requestConfig) &&
            !requestConfig._unauthorizedNotified
          ) {
            requestConfig._unauthorizedNotified = true;
            reportUnauthorized({
              status,
              url: String(requestConfig.url ?? ""),
              source: "fetchData-payload",
            });
          }
        } else {
          try {
            reportGlobalError(apiErr.message ?? "Ett fel uppstod");
          } catch {
            // ignore
          }
        }

        throw apiErr;
      }
    }

    return data;
  } catch (e) {
    const err = e as AxiosError;
    if (err && err.response) {
      const status = err.response.status ?? 0;
      const raw = err.response.data as unknown;
      const requestConfig = err.config as RetriableRequestConfig | undefined;
      let serverMsg: string | undefined;
      let code: string | undefined;
      if (typeof raw === "object" && raw !== null) {
        const rec = raw as Record<string, unknown>;
        if (typeof rec.error === "string") serverMsg = rec.error;
        else if (typeof rec.message === "string") serverMsg = rec.message;
        if (typeof rec.code === "string") code = rec.code;
      } else if (typeof raw === "string") {
        serverMsg = raw;
      }

      const STATUS_MESSAGES: Record<number, string> = {
        400: "Felaktig förfrågan",
        401: "Vänligen logga in",
        403: "Åtkomst nekad",
        404: "Hittades inte",
        429: "För många förfrågningar - försök igen senare",
        500: "Serverfel - försök igen senare",
      };

      const message =
        (serverMsg as string) ??
        STATUS_MESSAGES[status] ??
        `Request failed with status ${status}`;
      const apiErr: ApiError = {
        status,
        code,
        message,
        details: (raw as Record<string, unknown>)?.details,
      };

      if (status === 401) {
        if (
          !isAuthFlowRequest(requestConfig) &&
          !requestConfig?._unauthorizedNotified
        ) {
          if (requestConfig) requestConfig._unauthorizedNotified = true;
          reportUnauthorized({
            status,
            url: String(requestConfig?.url ?? ""),
            source: "fetchData-catch",
          });
        }
      } else {
        try {
          reportGlobalError(message);
        } catch {
          // ignore
        }
      }

      throw apiErr;
    }
    throw e;
  }
}

export default api;
