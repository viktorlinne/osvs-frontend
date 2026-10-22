import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import {
  hasActiveSession,
  parseSessionInfo,
  reportUnauthorized,
  setAuthenticatedSession,
} from "./globalAuth";
import type { ApiError } from "../types";
import { API_BASE_URL } from "./apiBaseUrl";

const BASE_URL = API_BASE_URL;

// Simple axios instance. `withCredentials` is required because the
// backend stores access/refresh tokens in HTTP-only cookies.
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

/**
 * Multipart uploads (profile pictures, posts, PDFs up to 5 MB) need far more
 * than the default 10 s on a slow uplink. A client-side timeout does not stop
 * the server from finishing the request, so a too-short timeout reports a
 * failure for an upload that actually succeeded (and invites a duplicate).
 */
export const UPLOAD_TIMEOUT_MS = 120_000;

api.interceptors.request.use((config) => {
  if (
    typeof FormData !== "undefined" &&
    config.data instanceof FormData &&
    (config.timeout ?? 0) < UPLOAD_TIMEOUT_MS
  ) {
    config.timeout = UPLOAD_TIMEOUT_MS;
  }
  return config;
});

export const NETWORK_ERROR_MESSAGE =
  "Kunde inte nå servern. Kontrollera anslutningen och försök igen.";
export const TIMEOUT_ERROR_MESSAGE =
  "Servern svarade inte i tid. Kontrollera om ändringen sparades innan du försöker igen.";
const UNAVAILABLE_MESSAGE =
  "Tjänsten är tillfälligt otillgänglig. Försök igen om en stund.";

const STATUS_MESSAGES: Record<number, string> = {
  400: "Felaktig förfrågan",
  401: "Vänligen logga in",
  403: "Åtkomst nekad",
  404: "Hittades inte",
  413: "Filen är för stor.",
  429: "För många förfrågningar. Försök igen senare.",
  500: "Serverfel. Försök igen senare.",
  502: UNAVAILABLE_MESSAGE,
  503: UNAVAILABLE_MESSAGE,
  504: UNAVAILABLE_MESSAGE,
};

/**
 * A plain-text body is only shown when it looks like a short message. Proxy
 * error pages (nginx 502/504 HTML while the backend restarts) must never end
 * up verbatim in the error banner.
 */
function plainTextServerMessage(raw: string): string | undefined {
  const text = raw.trim();
  if (!text || text.length > 300 || /^</.test(text)) return undefined;
  return text;
}

type ApiRequestConfig = AxiosRequestConfig & {
  _unauthorizedNotified?: boolean;
  _retriedAfterRefresh?: boolean;
};

export const SESSION_RENEWAL_RATE_LIMITED_MESSAGE =
  "Sessionen kunde inte förnyas just nu. Försök igen om en stund.";

type SessionRenewalPath = "/auth/refresh" | "/auth/heartbeat";

const SESSION_RENEWAL_LOCK = "osvs-session-renewal";
let sessionRenewal: Promise<unknown> | null = null;

function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

/**
 * Renews the session (POST /auth/refresh or /auth/heartbeat) with at most one
 * renewal in flight: concurrent callers in this tab share the same promise,
 * and other tabs wait on a Web Lock where supported. The backend rotates the
 * refresh token on every renewal; of two parallel renewals with one token only
 * the first wins and the other gets a 401, so renewals must not run in parallel.
 *
 * Rejects with an ApiError. A 401 means the session is gone; a 429 is mapped
 * to a Swedish "try again later" message and does NOT mean logged out.
 */
export function renewSession(
  path: SessionRenewalPath = "/auth/refresh",
): Promise<unknown> {
  if (sessionRenewal) return sessionRenewal;

  const run = async () => {
    try {
      return await fetchData(api.post(path));
    } catch (error) {
      if (errorStatus(error) === 429) {
        const rateLimited: ApiError = {
          status: 429,
          message: SESSION_RENEWAL_RATE_LIMITED_MESSAGE,
        };
        throw rateLimited;
      }
      throw error;
    }
  };

  const locks =
    typeof navigator !== "undefined" ? navigator.locks : undefined;
  const pending: Promise<unknown> = locks
    ? locks.request(SESSION_RENEWAL_LOCK, run)
    : run();

  sessionRenewal = pending;
  const clear = () => {
    if (sessionRenewal === pending) sessionRenewal = null;
  };
  pending.then(clear, clear);
  return pending;
}

function notifyUnauthorized(config: ApiRequestConfig, status: number) {
  if (config._unauthorizedNotified) return;
  config._unauthorizedNotified = true;
  reportUnauthorized({
    status,
    url: String(config.url ?? ""),
    source: "axios-interceptor",
  });
}

function getRequestPath(config?: AxiosRequestConfig): string {
  const rawUrl = String(config?.url ?? "");
  if (!rawUrl) return "";

  const normalized = rawUrl.startsWith("http")
    ? new URL(rawUrl).pathname
    : rawUrl;

  return normalized
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/api\b/, "")
    .split("?")[0] ?? "";
}

function isAuthFlowRequest(config?: AxiosRequestConfig): boolean {
  return /^\/auth(?:\/|$)/.test(getRequestPath(config));
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const originalConfig = err.config as ApiRequestConfig | undefined;
    if (!originalConfig) return Promise.reject(err);

    const status = err.response?.status;
    if (status !== 401 || isAuthFlowRequest(originalConfig)) {
      return Promise.reject(err);
    }

    // The access token has expired (or was dropped). If we believe we are
    // logged in, renew once (shared with any concurrent 401s) and retry.
    if (!originalConfig._retriedAfterRefresh && hasActiveSession()) {
      originalConfig._retriedAfterRefresh = true;
      try {
        const renewed = await renewSession("/auth/refresh");
        const session = parseSessionInfo(
          renewed && typeof renewed === "object"
            ? (renewed as Record<string, unknown>).session
            : undefined,
        );
        if (session) setAuthenticatedSession(session);
      } catch (renewError) {
        if (errorStatus(renewError) !== 401) {
          // Rate limited, network or server error: the session may still be
          // valid, so keep the auth state and surface the renewal error.
          return Promise.reject(renewError);
        }
        notifyUnauthorized(originalConfig, 401);
        return Promise.reject(err);
      }
      return api.request(originalConfig);
    }

    notifyUnauthorized(originalConfig, status);
    return Promise.reject(err);
  },
);

// Small helper to unwrap `response.data` and normalize errors.
export async function fetchData<T = unknown>(
  req: Promise<AxiosResponse<T>>,
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
          const requestConfig = config as ApiRequestConfig;
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
      const requestConfig = err.config as ApiRequestConfig | undefined;
      let serverMsg: string | undefined;
      let code: string | undefined;
      if (typeof raw === "object" && raw !== null) {
        const rec = raw as Record<string, unknown>;
        if (typeof rec.error === "string") serverMsg = rec.error;
        else if (typeof rec.message === "string") serverMsg = rec.message;
        if (typeof rec.code === "string") code = rec.code;
      } else if (typeof raw === "string") {
        serverMsg = plainTextServerMessage(raw);
      }

      const message =
        serverMsg ??
        STATUS_MESSAGES[status] ??
        `Begäran misslyckades (status ${status})`;
      const apiErr: ApiError = {
        status,
        code,
        message,
        details:
          typeof raw === "object" && raw !== null
            ? (raw as Record<string, unknown>).details
            : undefined,
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
      }

      throw apiErr;
    }
    // No response: offline, DNS/TLS failure, or our own timeout. Normalise to
    // an ApiError with a Swedish message instead of axios' English text
    // ("Network Error", "timeout of 10000ms exceeded"). Cancellations are
    // passed through untouched so callers can ignore them.
    if (axios.isAxiosError(e) && !axios.isCancel(e)) {
      const timedOut = e.code === "ECONNABORTED" || e.code === "ETIMEDOUT";
      const apiErr: ApiError = {
        status: 0,
        code: timedOut ? "TIMEOUT" : "NETWORK_ERROR",
        message: timedOut ? TIMEOUT_ERROR_MESSAGE : NETWORK_ERROR_MESSAGE,
      };
      throw apiErr;
    }
    throw e;
  }
}

export default api;
