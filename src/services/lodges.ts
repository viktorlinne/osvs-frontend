import api, { fetchData } from "./api";

export async function listLodges() {
  const data = (await fetchData(api.get("/lodges"))) as unknown;
  if (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as Record<string, unknown>).lodges)
  ) {
    return (data as Record<string, unknown>).lodges as Array<{
      id: number;
      name: string;
    }>;
  }
  return [] as Array<{ id: number; name: string }>;
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
