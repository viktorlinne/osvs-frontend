import api, { fetchData } from "./api";

export async function createMembership(payload: { year: number; amount: number }) {
	return fetchData(api.post(`/swish/membership`, payload));
}

export async function getMembership(id: string | number) {
	return fetchData(api.get(`/swish/membership/${id}`));
}

export async function getMembershipStatus(token: string) {
	return fetchData(api.get(`/swish/membership/status/${token}`));
}

export default { createMembership, getMembership, getMembershipStatus };
