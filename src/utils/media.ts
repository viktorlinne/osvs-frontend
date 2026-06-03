const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : `${import.meta.env.VITE_BACKEND_URL}/api`;

export function mediaPlaceholderUrl(type: string): string {
  return `${API_BASE_URL}/media/placeholders/${encodeURIComponent(type)}`;
}
