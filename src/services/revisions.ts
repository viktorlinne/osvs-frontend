import api, { fetchData } from "./api";
import type { Revision } from "../types";

type ListRevisionsParams = {
  year?: number | string;
  lodgeId?: number | string;
};

function normalizeRevision(raw: Revision): Revision | null {
  const id = Number(raw?.id);
  const lid = Number(raw?.lid);
  const year = Number(raw?.year);
  const title = String(raw?.title ?? "").trim();
  const lodgeName = String(raw?.lodgeName ?? "").trim();

  if (!Number.isFinite(id) || !Number.isFinite(lid) || !Number.isFinite(year)) {
    return null;
  }
  if (title.length === 0 || lodgeName.length === 0) {
    return null;
  }

  return {
    id,
    lid,
    year,
    title,
    lodgeName,
    picture: raw?.picture ?? null,
    pictureUrl: raw?.pictureUrl ?? null,
  };
}

export async function listRevisions(params?: ListRevisionsParams): Promise<Revision[]> {
  const search = new URLSearchParams();

  if (params?.year !== undefined && String(params.year).trim().length > 0) {
    search.set("year", String(params.year).trim());
  }
  if (params?.lodgeId !== undefined && String(params.lodgeId).trim().length > 0) {
    search.set("lodgeId", String(params.lodgeId).trim());
  }

  const query = search.toString();
  const url = query ? `/revisions?${query}` : "/revisions";
  const res = await fetchData(api.get(url));
  const raw = (res as { revisions?: Revision[] })?.revisions;
  if (!Array.isArray(raw)) return [];

  return raw.map(normalizeRevision).filter(Boolean) as Revision[];
}

export async function createRevision(payload: FormData) {
  return fetchData(api.post("/revisions", payload));
}

export default {
  listRevisions,
  createRevision,
};
