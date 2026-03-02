import api, { fetchData } from "./api";
import type {
  AuthUser,
  LoginPayload,
} from "../types";
import {
  parseAllergies,
  parseOfficialHistory,
} from "./parsers/userMetadata";

type OfficialPayload = { id?: unknown };

function mergeAuthResponse(res: unknown): AuthUser | null {
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
  // Attach achievements if provided either at top-level or on the user object
  const rawAchievements = Array.isArray(rec.achievements)
    ? rec.achievements
    : Array.isArray(rawUser.achievements)
    ? (rawUser.achievements as unknown[])
    : undefined;
  if (result && Array.isArray(rawAchievements)) {
    result.achievements = rawAchievements
      .map((a) => a as Record<string, unknown>)
      .map((a) => ({
        id: Number(a.id),
        aid: Number(a.aid),
        awardedAt: String(a.awardedAt ?? ""),
        title: String(a.title ?? ""),
      }))
      .filter((a) => Number.isFinite(a.id));
  }

  const rawAllergies = Array.isArray(rec.allergies)
    ? rec.allergies
    : Array.isArray(rawUser.allergies)
    ? (rawUser.allergies as unknown[])
    : undefined;
  const parsedAllergies = parseAllergies(rawAllergies);
  if (parsedAllergies.length > 0) {
    result.allergies = parsedAllergies;
  } else if (Array.isArray(rawAllergies)) {
    result.allergies = [];
  }

  // Attach officials if provided either at top-level or on the user object
  const rawOfficials = Array.isArray(rec.officials)
    ? rec.officials
    : Array.isArray(rawUser.officials)
    ? (rawUser.officials as unknown[])
    : undefined;
  if (result && Array.isArray(rawOfficials)) {
    result.officials = rawOfficials
      .map((o) => {
        if (typeof o === "object" && o !== null && "id" in o) {
          return Number((o as OfficialPayload).id);
        }
        return Number(o);
      })
      .filter((n): n is number => Number.isFinite(n));
  }

  const rawOfficialHistory = Array.isArray(rec.officialHistory)
    ? rec.officialHistory
    : rawUser.officialHistory;
  const parsedOfficialHistory = parseOfficialHistory(rawOfficialHistory);
  if (parsedOfficialHistory.length > 0) {
    result.officialHistory = parsedOfficialHistory;
  } else if (Array.isArray(rawOfficialHistory)) {
    result.officialHistory = [];
  }
  return result;
}

async function fetchCurrentAuthUser(): Promise<AuthUser | null> {
  const res = await fetchData(api.get("/auth/me"));
  return mergeAuthResponse(res);
}

export async function login({
  email,
  password,
}: LoginPayload): Promise<AuthUser | null> {
  await fetchData(api.post<LoginPayload>("/auth/login", { email, password }));
  return fetchCurrentAuthUser();
}

export async function logout(): Promise<void> {
  await fetchData(api.post<void>("/auth/logout"));
}

export async function me(): Promise<AuthUser | null> {
  return fetchCurrentAuthUser();
}

export default { login, logout, me };
