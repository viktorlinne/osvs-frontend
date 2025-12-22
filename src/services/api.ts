import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { reportGlobalError } from "./globalError";
import type { ApiError } from "@osvs/types";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

// Simple axios instance. `withCredentials` is required because the
// backend stores access/refresh tokens in HTTP-only cookies.
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Minimal refresh strategy: on first 401 we POST to `/auth/refresh`
// using the browser `fetch` API (to avoid axios interceptor recursion).
// If the refresh succeeds we retry the original request once.
api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const originalConfig = err.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    if (!originalConfig) return Promise.reject(err);

    const status = err.response?.status;
    if (status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;
      try {
        const resp = await fetch(
          `${BASE_URL.replace(/\/$/, "")}/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
          }
        );
        if (resp.ok) {
          return api.request(originalConfig);
        }
      } catch {
        // fallthrough to reject with original error
      }
    }

    return Promise.reject(err);
  }
);

// Small helper to unwrap `response.data` and normalize errors.
export async function fetchData<T = unknown>(
  req: Promise<AxiosResponse<T>>
): Promise<T> {
  try {
    const { data } = await req;
    return data;
  } catch (e) {
    const err = e as AxiosError;
    if (err && err.response) {
      const status = err.response.status ?? 0;
      const raw = err.response.data as unknown;
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
        429: "För många förfrågningar — försök igen senare",
        500: "Serverfel — försök igen senare",
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
      // Report to global error banner (if registered)
      try {
        reportGlobalError(message);
      } catch {
        // ignore
      }
      throw apiErr;
    }
    throw e;
  }
}

export default api;
