 import api, { fetchData } from "./api";
import type { Lodge } from "../types";

export type UserLodgeResponse = { lodge: Lodge | null } | null;

export async function updateMe(payload: Record<string, unknown>) {
  return fetchData(api.put("/users/me", payload));
}

export async function adminUpdateUser(
  id: number | string,
  payload: Record<string, unknown>
) {
  return fetchData(api.put(`/users/${id}`, payload));
}

export async function uploadMyPicture(file: File) {
  const fd = new FormData();
  fd.append("picture", file);
  return fetchData(api.post("/users/me/picture", fd));
}

export async function uploadUserPicture(id: number | string, file: File) {
  const fd = new FormData();
  fd.append("picture", file);
  return fetchData(api.post(`/users/${id}/picture`, fd));
}

export async function getUserLodge(
  id: number | string
): Promise<UserLodgeResponse> {
  return fetchData<UserLodgeResponse>(api.get(`/users/${id}/lodges`));
}

export async function setUserLodge(
  id: number | string,
  lodgeId: number | null
) {
  return fetchData(api.post(`/users/${id}/lodges`, { lodgeId }));
}

export async function setRoles(id: number | string, roleIds: number[]) {
  return fetchData(api.post(`/users/${id}/roles`, { roleIds }));
}

export async function postAchievement(
  id: number | string,
  payload: { achievementId: number; awardedAt?: string }
) {
  return fetchData(api.post(`/users/${id}/achievements`, payload));
}

export default {
  updateMe,
  adminUpdateUser,
  uploadMyPicture,
  uploadUserPicture,
  setRoles,
  postAchievement,
};
