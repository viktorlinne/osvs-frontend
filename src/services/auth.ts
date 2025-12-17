import api, { fetchData } from "./api";
import type { AuthUser, LoginPayload } from "../types/auth";

function mergeAuthResponse(res: unknown): AuthUser {
  if (res == null) return null;
  if (typeof res !== "object") return null;
  const rec = res as Record<string, unknown>;
  // backend returns { user: PublicUser, roles: string[] } or a PublicUser directly
  const rawUser = (rec.user ?? rec) as Record<string, unknown> | null;
  if (!rawUser) return null;

  let roles: string[] = [];
  if (Array.isArray(rec.roles)) {
    roles = rec.roles.filter((r): r is string => typeof r === "string");
  } else if (Array.isArray(rawUser.roles)) {
    roles = (rawUser.roles as unknown[]).filter(
      (r): r is string => typeof r === "string"
    );
  }

  const result = { ...rawUser, roles } as AuthUser;
  return result;
}

export async function login({
  email,
  password,
}: LoginPayload): Promise<AuthUser> {
  await fetchData(api.post<LoginPayload>("/auth/login", { email, password }));
  const res = await fetchData(api.get("/auth/me"));
  return mergeAuthResponse(res);
}

export async function logout(): Promise<void> {
  await fetchData(api.post<void>("/auth/logout"));
}

export async function me(): Promise<AuthUser> {
  const res = await fetchData(api.get("/auth/me"));
  return mergeAuthResponse(res);
}

export default { login, logout, me };
