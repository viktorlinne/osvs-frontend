import api, { fetchData } from "./api";
import type {
  Event as EventRecord,
  Lodge,
  CreateEventBody,
  UpdateEventBody,
  RsvpApiStatus,
  EventAttendanceRow,
  PatchEventAttendanceBody,
} from "../types";
import {
  readArrayField,
  readBooleanField,
  readNullableStringField,
  readNumberField,
  readObjectField,
} from "./parsers/response";

export type EventMutationResult = {
  success: boolean;
};

export type CreateEventResult = EventMutationResult & {
  id: number | null;
};

export type SetRsvpResult = EventMutationResult & {
  status: string | null;
};

export type EventFoodResponse = {
  bookFood: boolean | null;
};

export type SetFoodResult = EventMutationResult & EventFoodResponse;

export type PatchEventAttendanceResult = EventMutationResult & {
  row: EventAttendanceRow | null;
};

function parseMutationResult(source: unknown): EventMutationResult {
  return {
    success: readBooleanField(source, "success") ?? false,
  };
}

export async function listEvents(): Promise<{ events: EventRecord[] }> {
  return fetchData<{ events: EventRecord[] }>(api.get("/events"));
}

export async function listUpcomingEvents(
  limit = 10,
): Promise<{ events: EventRecord[] }> {
  return fetchData<{ events: EventRecord[] }>(
    api.get(`/events/upcoming?limit=${limit}`),
  );
}

export async function getEvent(
  id: number | string,
): Promise<EventRecord | null> {
  const response = await fetchData(api.get(`/events/${id}`));
  return (readObjectField(response, "event") as EventRecord | null) ?? null;
}

export async function listMyEvents(): Promise<{ events: EventRecord[] }> {
  return fetchData<{ events: EventRecord[] }>(api.get(`/events/mine`));
}

export async function createEvent(
  payload: CreateEventBody,
): Promise<CreateEventResult> {
  const response = await fetchData(api.post(`/events`, payload));
  return {
    ...parseMutationResult(response),
    id: readNumberField(response, "id"),
  };
}

export async function updateEvent(
  id: number | string,
  payload: UpdateEventBody,
): Promise<EventMutationResult> {
  return parseMutationResult(await fetchData(api.put(`/events/${id}`, payload)));
}

export async function deleteEvent(
  id: number | string,
): Promise<EventMutationResult> {
  return parseMutationResult(await fetchData(api.delete(`/events/${id}`)));
}

export async function linkLodgeEvent(
  eventId: number | string,
  lodgeId: number | string,
): Promise<EventMutationResult> {
  return parseMutationResult(
    await fetchData(api.post(`/events/${eventId}/lodges`, { lodgeId })),
  );
}

export async function unlinkLodgeEvent(
  eventId: number | string,
  lodgeId: number | string,
): Promise<EventMutationResult> {
  return parseMutationResult(await fetchData(
    api.delete<{ success?: boolean }>(`/events/${eventId}/lodges`, {
      data: { lodgeId },
    }),
  ));
}

export async function listEventLodges(
  eventId: number | string,
): Promise<Lodge[]> {
  const response = await fetchData(api.get(`/events/${eventId}/lodges`));
  return readArrayField<Lodge>(response, "lodges");
}

export async function setRsvp(
  eventId: number | string,
  status: RsvpApiStatus,
): Promise<SetRsvpResult> {
  const response = await fetchData(api.post(`/events/${eventId}/rsvp`, { status }));
  return {
    ...parseMutationResult(response),
    status: readNullableStringField(response, "status"),
  };
}

export async function getRsvp(
  eventId: number | string,
): Promise<string | null> {
  const response = await fetchData(api.get(`/events/${eventId}/rsvp`));
  return readNullableStringField(response, "rsvp");
}

export async function getFood(
  eventId: number | string,
): Promise<boolean | null> {
  const response = await fetchData(api.get(`/events/${eventId}/food`));
  return readBooleanField(response, "bookFood");
}

export async function setFood(
  eventId: number | string,
  bookFood: boolean,
): Promise<SetFoodResult> {
  const response = await fetchData(api.post(`/events/${eventId}/food`, { bookFood }));
  return {
    ...parseMutationResult(response),
    bookFood: readBooleanField(response, "bookFood"),
  };
}

export async function listEventAttendances(
  eventId: number | string,
): Promise<EventAttendanceRow[]> {
  const response = await fetchData(api.get(`/events/${eventId}/attendances`));
  return readArrayField<EventAttendanceRow>(response, "attendances");
}

export async function patchEventAttendance(
  eventId: number | string,
  uid: number | string,
  payload: PatchEventAttendanceBody,
): Promise<PatchEventAttendanceResult> {
  const response = await fetchData(
    api.patch(`/events/${eventId}/attendances/${uid}`, payload),
  );
  return {
    ...parseMutationResult(response),
    row: (readObjectField(response, "row") as EventAttendanceRow | null) ?? null,
  };
}

export default {
  listEvents,
  listUpcomingEvents,
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
  getFood,
  setFood,
  listEventAttendances,
  patchEventAttendance,
};
