import api, { fetchData } from "./api";
import type {
  Achievement,
  Allergy,
  AttendedEvent,
  AttendedEventsResponse,
  Lodge,
  Official,
  OfficialHistoryItem,
  PublicUser,
} from "../types";

export type UserLodgeResponse = { lodge: Lodge | null } | null;

export type ListUsersFilters = {
  name?: string;
  achievementId?: number | null;
  lodgeId?: number | null;
};

export type PublicUserDetailResponse = {
  user: PublicUser | null;
  achievements: Achievement[];
  allergies: Allergy[];
  officials: Official[];
  officialHistory: OfficialHistoryItem[];
};

type AllergyPayload = { id?: unknown; title?: unknown };
type OfficialHistoryPayload = {
  id?: unknown;
  title?: unknown;
  appointedAt?: unknown;
  unappointedAt?: unknown;
  unAppointedAt?: unknown;
};
type AttendedEventPayload = {
  id?: unknown;
  title?: unknown;
  startDate?: unknown;
  endDate?: unknown;
};

function parseAllergies(value: unknown): Allergy[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => entry as AllergyPayload)
    .map((entry) => ({
      id: Number(entry.id),
      title: String(entry.title ?? ""),
    }))
    .filter((entry) => Number.isFinite(entry.id) && entry.title.length > 0);
}

function parseOfficialHistory(value: unknown): OfficialHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => entry as OfficialHistoryPayload)
    .map((entry) => ({
      id: Number(entry.id),
      title: String(entry.title ?? ""),
      appointedAt: String(entry.appointedAt ?? ""),
      unappointedAt: String(entry.unappointedAt ?? entry.unAppointedAt ?? ""),
    }))
    .filter(
      (entry) =>
        Number.isFinite(entry.id) &&
        entry.title.length > 0 &&
        entry.appointedAt.length > 0 &&
        entry.unappointedAt.length > 0,
    );
}

function parseAttendedEvents(value: unknown): AttendedEvent[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => entry as AttendedEventPayload)
    .map((entry) => ({
      id: Number(entry.id),
      title: String(entry.title ?? ""),
      startDate: String(entry.startDate ?? ""),
      endDate: String(entry.endDate ?? ""),
    }))
    .filter((entry) => Number.isFinite(entry.id));
}

function parseAttendedEventsResponse(value: unknown): AttendedEventsResponse {
  const payload = value as {
    events?: unknown;
    sinceLastAchievementCount?: unknown;
    lastAchievementAt?: unknown;
  };
  return {
    events: parseAttendedEvents(payload?.events),
    sinceLastAchievementCount: Number.isFinite(
      Number(payload?.sinceLastAchievementCount),
    )
      ? Number(payload?.sinceLastAchievementCount)
      : 0,
    lastAchievementAt:
      typeof payload?.lastAchievementAt === "string" &&
      payload.lastAchievementAt.length > 0
        ? payload.lastAchievementAt
        : null,
  };
}

export async function updateMe(payload: Record<string, unknown>) {
  return fetchData(api.put("/users/me", payload));
}

export async function adminUpdateUser(
  matrikelnummer: number | string,
  payload: Record<string, unknown>,
) {
  return fetchData(api.put(`/users/${matrikelnummer}`, payload));
}

export async function uploadMyPicture(file: File) {
  const fd = new FormData();
  fd.append("picture", file);
  return fetchData(api.post("/users/me/picture", fd));
}

export async function uploadUserPicture(
  matrikelnummer: number | string,
  file: File,
) {
  const fd = new FormData();
  fd.append("picture", file);
  return fetchData(api.post(`/users/${matrikelnummer}/picture`, fd));
}

export async function listUsers(
  filters?: ListUsersFilters,
): Promise<PublicUser[]> {
  const search = new URLSearchParams();
  if (filters?.name) search.set("name", filters.name);
  if (filters?.achievementId != null) {
    search.set("achievementId", String(filters.achievementId));
  }
  if (filters?.lodgeId != null) {
    search.set("lodgeId", String(filters.lodgeId));
  }
  const query = search.toString();
  const url = query ? `/users?${query}` : "/users";
  const res = await fetchData(api.get(url));
  return ((res as { users?: PublicUser[] })?.users ?? []) as PublicUser[];
}

export async function getPublicUserById(
  matrikelnummer: number | string,
): Promise<PublicUserDetailResponse> {
  const res = await fetchData(api.get(`/users/${matrikelnummer}`));
  const payload = res as {
    user?: PublicUser | null;
    achievements?: Achievement[];
    allergies?: Allergy[];
    officials?: Official[];
    officialHistory?: OfficialHistoryItem[];
  };
  const allergiesFromPayload = parseAllergies(payload?.allergies);
  const allergiesFromUser = parseAllergies(
    (payload?.user as { allergies?: unknown } | null | undefined)?.allergies,
  );
  const allergies =
    allergiesFromPayload.length > 0
      ? allergiesFromPayload
      : Array.isArray(payload?.allergies)
      ? []
      : allergiesFromUser;

  const historyFromPayload = parseOfficialHistory(payload?.officialHistory);
  const historyFromUser = parseOfficialHistory(
    (payload?.user as { officialHistory?: unknown } | null | undefined)
      ?.officialHistory,
  );
  const officialHistory =
    historyFromPayload.length > 0
      ? historyFromPayload
      : Array.isArray(payload?.officialHistory)
        ? []
        : historyFromUser;

  return {
    user: payload?.user
      ? ({ ...payload.user, allergies, officialHistory } as PublicUser)
      : null,
    achievements: Array.isArray(payload?.achievements)
      ? payload.achievements
      : [],
    allergies,
    officials: Array.isArray(payload?.officials) ? payload.officials : [],
    officialHistory,
  };
}

export async function getUserRoles(
  matrikelnummer: number | string,
): Promise<string[]> {
  const res = await fetchData(api.get(`/users/${matrikelnummer}/roles`));
  const roles = (res as { roles?: unknown[] })?.roles;
  if (!Array.isArray(roles)) return [];
  return roles.filter((role): role is string => typeof role === "string");
}

export async function getUserLodge(
  matrikelnummer: number | string,
): Promise<UserLodgeResponse> {
  return fetchData<UserLodgeResponse>(api.get(`/users/${matrikelnummer}/lodges`));
}

export async function setUserLodge(
  matrikelnummer: number | string,
  lodgeId: number | null,
) {
  return fetchData(api.post(`/users/${matrikelnummer}/lodges`, { lodgeId }));
}

export async function setRoles(
  matrikelnummer: number | string,
  roleIds: number[],
) {
  return fetchData(api.post(`/users/${matrikelnummer}/roles`, { roleIds }));
}

export async function postAchievement(
  matrikelnummer: number | string,
  payload: { achievementId: number; awardedAt?: string },
) {
  return fetchData(api.post(`/users/${matrikelnummer}/achievements`, payload));
}

export async function getMyAttendedEvents(): Promise<AttendedEventsResponse> {
  const res = await fetchData(api.get("/users/me/attended"));
  return parseAttendedEventsResponse(res);
}

export async function getUserAttendedEvents(
  matrikelnummer: number | string,
): Promise<AttendedEventsResponse> {
  const res = await fetchData(api.get(`/users/${matrikelnummer}/attended`));
  return parseAttendedEventsResponse(res);
}

export default {
  updateMe,
  adminUpdateUser,
  uploadMyPicture,
  uploadUserPicture,
  listUsers,
  getPublicUserById,
  getUserRoles,
  getUserLodge,
  setUserLodge,
  setRoles,
  postAchievement,
  getMyAttendedEvents,
  getUserAttendedEvents,
};
