import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api";

// Simple axios instance. `withCredentials` is required because the
// backend stores access/refresh tokens in HTTP-only cookies.
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10_000,
});

// Minimal refresh strategy: on first 401 we POST to `/auth/refresh`
// using the browser `fetch` API (to avoid axios interceptor recursion).
// If the refresh succeeds we retry the original request once.
api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const originalConfig = err.config as AxiosRequestConfig & { _retry?: boolean };
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
      } catch (e) {
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
      const apiErr = (err.response.data as any)?.error ?? (err.response.data as any)?.message;
      throw new Error(apiErr ?? `Request failed with status ${err.response.status}`);
    }
    throw e;
  }
}

export default api;
