import api, { fetchData } from "./api";
import type { Lodge } from "@osvs/types";

export async function listLodges() {
  const data = (await fetchData(api.get("/lodges"))) as unknown;
  if (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as Record<string, unknown>).lodges)
  ) {
    return (data as Record<string, unknown>).lodges as Lodge[];
  }
  return [] as Lodge[];
}

export async function createLodge(payload: Record<string, unknown>) {
  return fetchData(api.post("/lodges", payload));
}

export async function updateLodge(
  id: number | string,
  payload: Record<string, unknown>
) {
  return fetchData(api.put(`/lodges/${id}`, payload));
}

export default { listLodges, createLodge, updateLodge };
