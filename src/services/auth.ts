import api, { fetchData } from "./api";
import type {
  AuthUser,
  LoginPayload,
} from "../types";
import { parseSessionInfo, type SessionInfo } from "./globalAuth";
import {
  parseAllergies,
  parseOfficialHistory,
} from "./parsers/userMetadata";

type OfficialPayload = { id?: unknown };
export type AuthState = {
  user: AuthUser | null;
  session: SessionInfo | null;
};

export type RegisterMemberResponse = {
  user?: {
    matrikelnummer?: unknown;
    pictureUrl?: unknown;
  };
  roles?: unknown;
};

let restoreSessionPromise: Promise<AuthState> | null = null;

function readSessionInfo(res: unknown): SessionInfo {
  const record = res && typeof res === "object"
    ? (res as Record<string, unknown>)
    : null;
  const session = parseSessionInfo(record?.session);
  if (!session) {
    throw new Error("Ogiltigt sessionssvar från servern");
  }
  return session;
}

function mergeAuthResponse(res: unknown): AuthUser | null {
  if (res == null) return null;
  if (typeof res !== "object") return null;
  const rec = res as Record<string, unknown>;
  // backend returns { user: PublicUser, roles, achievements, allergies, officials, officialHistory }
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
  const rawAchievements = Array.isArray(rec.achievements) ? rec.achievements : undefined;
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

  const rawAllergies = Array.isArray(rec.allergies) ? rec.allergies : undefined;
  const parsedAllergies = parseAllergies(rawAllergies);
  if (parsedAllergies.length > 0) {
    result.allergies = parsedAllergies;
  } else if (Array.isArray(rawAllergies)) {
    result.allergies = [];
  }

  const rawOfficials = Array.isArray(rec.officials) ? rec.officials : undefined;
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
    : undefined;
  const parsedOfficialHistory = parseOfficialHistory(rawOfficialHistory);
  if (parsedOfficialHistory.length > 0) {
    result.officialHistory = parsedOfficialHistory;
  } else if (Array.isArray(rawOfficialHistory)) {
    result.officialHistory = [];
  }
  return result;
}

function mergeAuthState(res: unknown): AuthState {
  const record = res && typeof res === "object"
    ? (res as Record<string, unknown>)
    : null;

  return {
    user: mergeAuthResponse(res),
    session: parseSessionInfo(record?.session),
  };
}

async function fetchCurrentAuthUser(): Promise<AuthState> {
  const res = await fetchData(api.get("/auth/me"));
  return mergeAuthState(res);
}

export async function login({
  email,
  password,
}: LoginPayload): Promise<AuthState> {
  await fetchData(api.post<LoginPayload>("/auth/login", { email, password }));
  return fetchCurrentAuthUser();
}

export async function registerMember(
  payload: FormData,
): Promise<RegisterMemberResponse> {
  const res = await fetchData(api.post("/auth/register", payload));
  return res && typeof res === "object"
    ? (res as RegisterMemberResponse)
    : {};
}

export async function restoreSession(): Promise<AuthState> {
  if (restoreSessionPromise) {
    return restoreSessionPromise;
  }

  restoreSessionPromise = (async () => {
    const session = readSessionInfo(await fetchData(api.post("/auth/refresh")));
    const authState = await fetchCurrentAuthUser();
    return {
      user: authState.user,
      session: authState.session ?? session,
    };
  })();

  try {
    return await restoreSessionPromise;
  } finally {
    restoreSessionPromise = null;
  }
}

export async function heartbeat(): Promise<SessionInfo> {
  return readSessionInfo(await fetchData(api.post("/auth/heartbeat")));
}

export async function logout(): Promise<void> {
  await fetchData(api.post<void>("/auth/logout"));
}

export async function me(): Promise<AuthState> {
  return fetchCurrentAuthUser();
}

export default { heartbeat, login, logout, me, registerMember, restoreSession };
