import api, { fetchData } from "./api";

export async function listEstablishments() {
	return fetchData(api.get("/establishments"));
}

export async function getEstablishment(id: number | string) {
	return fetchData(api.get(`/establishments/${id}`));
}

export async function createEstablishment(payload: Record<string, unknown>) {
	return fetchData(api.post("/establishments", payload));
}

export async function updateEstablishment(id: number | string, payload: Record<string, unknown>) {
	return fetchData(api.put(`/establishments/${id}`, payload));
}

export async function deleteEstablishment(id: number | string) {
	return fetchData(api.delete(`/establishments/${id}`));
}

export async function linkLodgeEstablishment(estId: number | string, lodgeId: number | string) {
	return fetchData(api.post(`/establishments/${estId}/lodges`, { lodgeId }));
}

export async function unlinkLodgeEstablishment(estId: number | string, lodgeId: number | string) {
	return fetchData(api.delete(`/establishments/${estId}/lodges`, { data: { lodgeId } }));
}

export default {
	listEstablishments,
	getEstablishment,
	createEstablishment,
	updateEstablishment,
	deleteEstablishment,
	linkLodgeEstablishment,
	unlinkLodgeEstablishment,
};
