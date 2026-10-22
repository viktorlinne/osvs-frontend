/**
 * Base URL of the API. Dev goes through the Vite proxy; production uses
 * VITE_BACKEND_URL (empty for the same-origin nginx deploy). An unset
 * variable must not turn into the literal "undefined/api", and a trailing
 * slash must not produce "//api".
 */
export function resolveApiBaseUrl(
  dev: boolean,
  backendUrl: string | undefined,
): string {
  if (dev) return "/api";
  return `${(backendUrl ?? "").trim().replace(/\/+$/, "")}/api`;
}

export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.DEV,
  import.meta.env.VITE_BACKEND_URL,
);
