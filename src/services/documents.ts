import api, { fetchData } from "./api";
import type { SiteDocument } from "../types";

function normalizeDocument(raw: SiteDocument): SiteDocument | null {
  const id = Number(raw?.id);
  const title = String(raw?.title ?? "").trim();
  if (!Number.isFinite(id) || title.length === 0) return null;

  return {
    id,
    title,
    picture: raw?.picture ?? null,
    pictureUrl: raw?.pictureUrl ?? null,
  };
}

export async function listDocuments(): Promise<SiteDocument[]> {
  const res = await fetchData(api.get("/documents"));
  const raw = (res as { documents?: SiteDocument[] })?.documents;
  if (!Array.isArray(raw)) return [];

  return raw.map(normalizeDocument).filter(Boolean) as SiteDocument[];
}

export async function createDocument(payload: FormData) {
  return fetchData(api.post("/documents", payload));
}

export default {
  listDocuments,
  createDocument,
};
