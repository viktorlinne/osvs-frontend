import api, { fetchData } from "./api";
import type {
  Event as EventRecord,
  Lodge,
  CreateEventBody,
  UpdateEventBody,
  RsvpApiStatus,
} from "../types";

export async function listEvents(): Promise<{ events: EventRecord[] }> {
  return fetchData<{ events: EventRecord[] }>(api.get("/events"));
}

export async function getEvent(
  id: number | string
): Promise<{ event?: EventRecord | null } | unknown> {
  return fetchData<{ event?: EventRecord | null }>(api.get(`/events/${id}`));
}

export async function listMyEvents(): Promise<{ events: EventRecord[] }> {
  return fetchData<{ events: EventRecord[] }>(api.get(`/events/mine`));
}

export async function createEvent(
  payload: CreateEventBody
): Promise<{ success?: boolean; id?: number } | unknown> {
  return fetchData<{ success?: boolean; id?: number }>(
    api.post(`/events`, payload)
  );
}

export async function updateEvent(
  id: number | string,
  payload: UpdateEventBody
): Promise<{ success?: boolean } | unknown> {
  return fetchData<{ success?: boolean }>(api.put(`/events/${id}`, payload));
}

export async function deleteEvent(
  id: number | string
): Promise<{ success?: boolean } | unknown> {
  return fetchData<{ success?: boolean }>(api.delete(`/events/${id}`));
}

export async function linkLodgeEvent(
  eventId: number | string,
  lodgeId: number | string
): Promise<{ success?: boolean } | unknown> {
  return fetchData<{ success?: boolean }>(
    api.post(`/events/${eventId}/lodges`, { lodgeId })
  );
}

export async function unlinkLodgeEvent(
  eventId: number | string,
  lodgeId: number | string
): Promise<{ success?: boolean } | unknown> {
  return fetchData(
    api.delete<{ success?: boolean }>(`/events/${eventId}/lodges`, {
      data: { lodgeId },
    })
  );
}

export async function listEventLodges(
  eventId: number | string
): Promise<{ lodges: Lodge[] } | unknown> {
  return fetchData<{ lodges: Lodge[] }>(api.get(`/events/${eventId}/lodges`));
}

export async function setRsvp(
  eventId: number | string,
  status: RsvpApiStatus
): Promise<{ success?: boolean; status?: string } | unknown> {
  return fetchData<{ success?: boolean; status?: string }>(
    api.post(`/events/${eventId}/rsvp`, { status })
  );
}

export async function getRsvp(
  eventId: number | string
): Promise<{ rsvp: string | null } | unknown> {
  return fetchData<{ rsvp: string | null }>(api.get(`/events/${eventId}/rsvp`));
}

export async function getEventStats(
  eventId: number | string
): Promise<
  { stats: { invited: number; answered: number; going: number } } | unknown
> {
  return fetchData<{
    stats: { invited: number; answered: number; going: number };
  }>(api.get(`/events/${eventId}/stats`));
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
  listEventLodges,
  setRsvp,
  getRsvp,
  getEventStats,
};
