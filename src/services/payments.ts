import api, { fetchData } from "./api";

export async function createMembershipPayment(payload: { year: number }) {
	return fetchData(api.post(`/payments/membership`, payload));
}

export async function getMembershipPayment(id: string | number) {
	return fetchData(api.get(`/payments/membership/${id}`));
}

export async function getMembershipStatusByToken(token: string) {
	return fetchData(api.get(`/payments/membership/status/${token}`));
}

export async function getMyMemberships(year?: number) {
	const qs = year ? `?year=${encodeURIComponent(String(year))}` : "";
	return fetchData(api.get(`/payments/membership${qs}`));
}

export async function createEventPayment(eventId: string | number, payload: Record<string, unknown> = {}) {
	return fetchData(api.post(`/payments/event/${eventId}`, payload));
}

export async function getEventPayment(eventId: string | number) {
	return fetchData(api.get(`/payments/event/${eventId}`));
}

export async function getEventStatusByToken(token: string) {
	return fetchData(api.get(`/payments/event/status/${token}`));
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
