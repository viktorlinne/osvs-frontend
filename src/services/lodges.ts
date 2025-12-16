import api, { fetchData } from "./api";

export async function listLodges() {
	return fetchData(api.get("/lodges"));
}

export async function createLodge(payload: Record<string, unknown>) {
	return fetchData(api.post("/lodges", payload));
}

export async function updateLodge(id: number | string, payload: Record<string, unknown>) {
	return fetchData(api.put(`/lodges/${id}`, payload));
}

export default { listLodges, createLodge, updateLodge };
