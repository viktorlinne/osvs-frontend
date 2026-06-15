import api, { fetchData } from "./api";
import type {
  AddAchievementBody,
  Achievement,
  Allergy,
  AttendedEvent,
  AttendedEventsResponse,
  Lodge,
  Official,
  OfficialHistoryItem,
  PublicUser,
  SetLodgeBody,
  SetRolesBody,
  UpdateUserProfileBody,
  UserMapPin,
} from "../types";
import { parseAllergies, parseOfficialHistory } from "./parsers/userMetadata";
import {
  readArrayField,
  readBooleanField,
  readNullableStringField,
  readNumberField,
  readObjectField,
  readStringField,
} from "./parsers/response";

export type UserLodgeResponse = { lodge: Lodge | null } | null;

export type UserMutationResult = {
  success: boolean;
};

export type PictureUploadResult = {
  pictureKey: string | null;
  pictureUrl: string | null;
};

export type AchievementMutationResult = UserMutationResult & {
  id: number | null;
  awardedAt: string | null;
};

export type ListUsersFilters = {
  name?: string;
  achievementId?: number | null;
  lodgeId?: number | null;
  officialId?: number | null;
  accommodationAvailable?: boolean | null;
  page?: number;
  pageSize?: number;
};

export type PublicUserDetailResponse = {
  user: PublicUser | null;
  achievements: Achievement[];
  allergies: Allergy[];
  officials: Official[];
  officialHistory: OfficialHistoryItem[];
};

export type PaginatedUsersResponse = {
  users: PublicUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function parseMutationResult(source: unknown): UserMutationResult {
  return {
    success: readBooleanField(source, "success") ?? false,
  };
}

type AttendedEventPayload = {
  id?: unknown;
  title?: unknown;
  startDate?: unknown;
  endDate?: unknown;
};

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
    totalMeetingsCount?: unknown;
    meetingsAfterGrade8Count?: unknown;
    createdAt?: unknown;
  };
  const events = parseAttendedEvents(payload?.events);
  return {
    events,
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
    totalMeetingsCount: Number.isFinite(Number(payload?.totalMeetingsCount))
      ? Number(payload?.totalMeetingsCount)
      : events.length,
    meetingsAfterGrade8Count: Number.isFinite(Number(payload?.meetingsAfterGrade8Count))
      ? Number(payload?.meetingsAfterGrade8Count)
      : 0,
    createdAt:
      typeof payload?.createdAt === "string" && payload.createdAt.length > 0
        ? payload.createdAt
        : null,
  };
}

function parseUserMapPins(value: unknown): UserMapPin[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => entry as Record<string, unknown>)
    .map((entry) => {
      const parsedRank = Number(entry.highestGradeRank);
      const highestGradeRank =
        Number.isFinite(parsedRank) && parsedRank >= 1 && parsedRank <= 10
          ? parsedRank
          : null;

      return {
        id: Number(entry.id),
        name: String(entry.name ?? "").trim(),
        lat: Number(entry.lat),
        lng: Number(entry.lng),
        lodgeId: Number.isFinite(Number(entry.lodgeId))
          ? Number(entry.lodgeId)
          : null,
        lodgeName:
          typeof entry.lodgeName === "string" && entry.lodgeName.trim().length > 0
            ? entry.lodgeName.trim()
            : null,
        highestGradeRank,
        highestGrade:
          typeof entry.highestGrade === "string" &&
          entry.highestGrade.trim().length > 0
            ? entry.highestGrade.trim()
            : null,
      };
    })
    .filter(
      (entry) =>
        Number.isFinite(entry.id) &&
        entry.name.length > 0 &&
        Number.isFinite(entry.lat) &&
        Number.isFinite(entry.lng),
    );
}

export async function updateMe(
  payload: UpdateUserProfileBody,
): Promise<PublicUser | null> {
  const response = await fetchData(api.put("/users/me", payload));
  return (readObjectField(response, "user") as PublicUser | null) ?? null;
}

export async function adminUpdateUser(
  matrikelnummer: number | string,
  payload: UpdateUserProfileBody,
): Promise<PublicUser | null> {
  const response = await fetchData(api.put(`/users/${matrikelnummer}`, payload));
  return (readObjectField(response, "user") as PublicUser | null) ?? null;
}

export async function uploadMyPicture(file: File): Promise<PictureUploadResult> {
  const fd = new FormData();
  fd.append("picture", file);
  const response = await fetchData(api.post("/users/me/picture", fd));
  return {
    pictureKey: readStringField(response, "pictureKey"),
    pictureUrl: readStringField(response, "pictureUrl"),
  };
}

export async function uploadUserPicture(
  matrikelnummer: number | string,
  file: File,
): Promise<PictureUploadResult> {
  const fd = new FormData();
  fd.append("picture", file);
  const response = await fetchData(api.post(`/users/${matrikelnummer}/picture`, fd));
  return {
    pictureKey: readStringField(response, "pictureKey"),
    pictureUrl: readStringField(response, "pictureUrl"),
  };
}

function buildListUsersSearch(filters?: ListUsersFilters) {
  const search = new URLSearchParams();
  if (filters?.name) search.set("name", filters.name);
  if (filters?.achievementId != null) {
    search.set("achievementId", String(filters.achievementId));
  }
  if (filters?.lodgeId != null) {
    search.set("lodgeId", String(filters.lodgeId));
  }
  if (filters?.officialId != null) {
    search.set("officialId", String(filters.officialId));
  }
  if (filters?.accommodationAvailable === true) {
    search.set("accommodationAvailable", "1");
  }
  if (typeof filters?.page === "number" && Number.isFinite(filters.page)) {
    search.set("page", String(filters.page));
  }
  if (typeof filters?.pageSize === "number" && Number.isFinite(filters.pageSize)) {
    search.set("pageSize", String(filters.pageSize));
  }
  return search;
}

function parsePaginatedUsersResponse(source: unknown): PaginatedUsersResponse {
  const users = readArrayField<PublicUser>(source, "users");
  const page = Math.max(1, readNumberField(source, "page") ?? 1);
  const pageSize = Math.max(1, readNumberField(source, "pageSize") ?? 24);
  const total = Math.max(0, readNumberField(source, "total") ?? users.length);
  const totalPages = Math.max(
    0,
    readNumberField(source, "totalPages") ?? Math.ceil(total / pageSize),
  );

  return {
    users,
    page,
    pageSize,
    total,
    totalPages,
  };
}

export async function listUsersPage(
  filters?: ListUsersFilters,
): Promise<PaginatedUsersResponse> {
  const search = buildListUsersSearch(filters);
  const query = search.toString();
  const url = query ? `/users?${query}` : "/users";
  const res = await fetchData(api.get(url));
  return parsePaginatedUsersResponse(res);
}

export async function listUsers(
  filters?: Omit<ListUsersFilters, "page" | "pageSize">,
): Promise<PublicUser[]> {
  const response = await listUsersPage({ ...filters, page: 1, pageSize: 100 });
  return response.users;
}

export async function listUsersMapPins(): Promise<UserMapPin[]> {
  const res = await fetchData(api.get("/users/map"));
  return parseUserMapPins(readArrayField<unknown>(res, "users"));
}

export async function getPublicUserById(
  matrikelnummer: number | string,
): Promise<PublicUserDetailResponse> {
  const res = await fetchData(api.get(`/users/${matrikelnummer}`));
  const allergies = parseAllergies(readArrayField<unknown>(res, "allergies"));
  const officialHistory = parseOfficialHistory(
    readArrayField<unknown>(res, "officialHistory"),
  );

  return {
    user: (readObjectField(res, "user") as PublicUser | null) ?? null,
    achievements: readArrayField<Achievement>(res, "achievements"),
    allergies,
    officials: readArrayField<Official>(res, "officials"),
    officialHistory,
  };
}

export async function getUserRoles(
  matrikelnummer: number | string,
): Promise<string[]> {
  const res = await fetchData(api.get(`/users/${matrikelnummer}/roles`));
  return readArrayField<unknown>(res, "roles").filter(
    (role): role is string => typeof role === "string",
  );
}

export async function getUserLodge(
  matrikelnummer: number | string,
): Promise<UserLodgeResponse> {
  return fetchData<UserLodgeResponse>(api.get(`/users/${matrikelnummer}/lodges`));
}

export async function setUserLodge(
  matrikelnummer: number | string,
  lodgeId: number | null,
): Promise<UserMutationResult> {
  const payload: SetLodgeBody = { lodgeId };
  return parseMutationResult(
    await fetchData(api.post(`/users/${matrikelnummer}/lodges`, payload)),
  );
}

export async function setUserLocation(
  matrikelnummer: number | string,
  payload: { lat: number; lng: number },
): Promise<UserMutationResult> {
  return parseMutationResult(
    await fetchData(api.put(`/users/${matrikelnummer}/location`, payload)),
  );
}

export async function clearUserLocationOverride(
  matrikelnummer: number | string,
): Promise<UserMutationResult> {
  return parseMutationResult(
    await fetchData(api.delete(`/users/${matrikelnummer}/location-override`)),
  );
}

export async function setRoles(
  matrikelnummer: number | string,
  roleIds: number[],
): Promise<UserMutationResult> {
  const payload: SetRolesBody = { roleIds };
  return parseMutationResult(
    await fetchData(api.post(`/users/${matrikelnummer}/roles`, payload)),
  );
}

export async function postAchievement(
  matrikelnummer: number | string,
  payload: AddAchievementBody,
): Promise<AchievementMutationResult> {
  const response = await fetchData(
    api.post(`/users/${matrikelnummer}/achievements`, payload),
  );
  return {
    ...parseMutationResult(response),
    id: readNumberField(response, "id"),
    awardedAt: readNullableStringField(response, "awardedAt"),
  };
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
  listUsersPage,
  listUsers,
  listUsersMapPins,
  getPublicUserById,
  getUserRoles,
  getUserLodge,
  setUserLodge,
  setUserLocation,
  clearUserLocationOverride,
  setRoles,
  postAchievement,
  getMyAttendedEvents,
  getUserAttendedEvents,
};
