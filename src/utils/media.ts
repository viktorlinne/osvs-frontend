import { API_BASE_URL } from "../services/apiBaseUrl";

export function mediaPlaceholderUrl(type: string): string {
  return `${API_BASE_URL}/media/placeholders/${encodeURIComponent(type)}`;
}
