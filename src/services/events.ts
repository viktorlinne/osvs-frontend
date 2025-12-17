import api, { fetchData } from "./api";

export async function listEvents() {
	return fetchData(api.get("/events"));
}

export async function getEvent(id: number | string) {
	return fetchData(api.get(`/events/${id}`));
}

export async function listMyEvents() {
	return fetchData(api.get(`/events/mine`));
}

export async function createEvent(payload: Record<string, unknown>) {
	return fetchData(api.post(`/events`, payload));
}

export async function updateEvent(id: number | string, payload: Record<string, unknown>) {
	return fetchData(api.put(`/events/${id}`, payload));
}

export async function deleteEvent(id: number | string) {
	return fetchData(api.delete(`/events/${id}`));
}

export async function linkLodgeEvent(eventId: number | string, lodgeId: number | string) {
	return fetchData(api.post(`/events/${eventId}/lodges`, { lodgeId }));
}

export async function unlinkLodgeEvent(eventId: number | string, lodgeId: number | string) {
	return fetchData(api.delete(`/events/${eventId}/lodges`, { data: { lodgeId } }));
}

export async function setRsvp(eventId: number | string, status: string) {
	return fetchData(api.post(`/events/${eventId}/rsvp`, { status }));
}

export async function getRsvp(eventId: number | string) {
	return fetchData(api.get(`/events/${eventId}/rsvp`));
}

export default {
	listEvents,
	getEvent,
	listMyEvents,
	createEvent,
	updateEvent,
	deleteEvent,
	linkLodgeEvent,
	unlinkLodgeEvent,
	setRsvp,
	getRsvp,
};
