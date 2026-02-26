import api, { fetchData } from "./api";
import type { Achievement, Lodge, Official, PublicUser } from "../types";

export type UserLodgeResponse = { lodge: Lodge | null } | null;

export type ListUsersFilters = {
  name?: string;
  achievementId?: number | null;
  lodgeId?: number | null;
};

export type PublicUserDetailResponse = {
  user: PublicUser | null;
  achievements: Achievement[];
  officials: Official[];
};

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
    officials?: Official[];
  };
  return {
    user: payload?.user ?? null,
    achievements: Array.isArray(payload?.achievements)
      ? payload.achievements
      : [],
    officials: Array.isArray(payload?.officials) ? payload.officials : [],
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
};
