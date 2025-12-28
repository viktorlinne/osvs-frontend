import api, { fetchData } from "./api";

export async function createMembershipPayment(payload: { year: number }) {
	return fetchData(api.post(`/stripe/membership`, payload));
}

export async function getMembershipPayment(id: string | number) {
	return fetchData(api.get(`/stripe/membership/${id}`));
}

export async function getMembershipStatusByToken(token: string) {
	return fetchData(api.get(`/stripe/membership/status/${token}`));
}

export async function getMyMemberships(year?: number) {
	const qs = year ? `?year=${encodeURIComponent(String(year))}` : "";
	return fetchData(api.get(`/stripe/membership${qs}`));
}

export async function createEventPayment(eventId: string | number, payload: Record<string, unknown> = {}) {
	return fetchData(api.post(`/stripe/event/${eventId}`, payload));
}

export async function getEventPayment(eventId: string | number) {
	return fetchData(api.get(`/stripe/event/${eventId}`));
}

export async function getEventStatusByToken(token: string) {
	return fetchData(api.get(`/stripe/event/status/${token}`));
}

export default {
	createMembershipPayment,
	getMembershipPayment,
	getMembershipStatusByToken,
	getMyMemberships,
	createEventPayment,
	getEventPayment,
	getEventStatusByToken,
};
