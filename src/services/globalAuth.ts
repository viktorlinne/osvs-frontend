export type SessionInfo = {
  inactivityTimeoutMs: number;
  inactivityExpiresAt: string;
  refreshWindowDays: number;
};

type UnauthorizedDetails = {
  status?: number;
  url?: string;
  source?: string;
};

let unauthorizedHandler: ((details?: UnauthorizedDetails) => void) | null = null;
let lastUnauthorizedAt = 0;
let sessionActive = false;
let expiredBannerShown = false;
let session: SessionInfo | null = null;

const UNAUTHORIZED_REPORT_DEDUPE_MS = 400;
const sessionListeners = new Set<(value: SessionInfo | null) => void>();

function cloneSession(value: SessionInfo | null) {
  return value ? { ...value } : null;
}

function emitSession() {
  const next = cloneSession(session);
  sessionListeners.forEach((listener) => {
    try {
      listener(next);
    } catch {
      // ignore listener errors
    }
  });
}

export function parseSessionInfo(value: unknown): SessionInfo | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const inactivityTimeoutMs = Number(record.inactivityTimeoutMs);
  const refreshWindowDays = Number(record.refreshWindowDays);
  const inactivityExpiresAt = String(record.inactivityExpiresAt ?? "");

  if (!Number.isFinite(inactivityTimeoutMs) || inactivityTimeoutMs <= 0) {
    return null;
  }
  if (!Number.isFinite(refreshWindowDays) || refreshWindowDays <= 0) {
    return null;
  }
  if (!inactivityExpiresAt || Number.isNaN(Date.parse(inactivityExpiresAt))) {
    return null;
  }

  return {
    inactivityTimeoutMs,
    inactivityExpiresAt,
    refreshWindowDays,
  };
}

export function getSessionInfo() {
  return cloneSession(session);
}

export function hasActiveSession() {
  return sessionActive;
}

export function isSessionExpired() {
  return Boolean(
    session && Date.parse(session.inactivityExpiresAt) <= Date.now(),
  );
}

export function subscribeSessionInfo(listener: (value: SessionInfo | null) => void) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

export function setAuthenticatedSession(nextSession: SessionInfo) {
  session = cloneSession(nextSession);
  sessionActive = true;
  expiredBannerShown = false;
  emitSession();
}

export function clearAuthSession() {
  session = null;
  sessionActive = false;
  emitSession();
}

export function registerUnauthorizedHandler(
  handler: (details?: UnauthorizedDetails) => void,
) {
  unauthorizedHandler = handler;
}

export function unregisterUnauthorizedHandler() {
  unauthorizedHandler = null;
}

export function reportUnauthorized(details?: UnauthorizedDetails) {
  if (!sessionActive || expiredBannerShown) return;

  const now = Date.now();
  if (now - lastUnauthorizedAt < UNAUTHORIZED_REPORT_DEDUPE_MS) return;
  lastUnauthorizedAt = now;
  expiredBannerShown = true;
  clearAuthSession();

  try {
    unauthorizedHandler?.(details);
  } catch {
    // ignore handler errors
  }
}

export default {
  clearAuthSession,
  getSessionInfo,
  hasActiveSession,
  isSessionExpired,
  parseSessionInfo,
  registerUnauthorizedHandler,
  reportUnauthorized,
  setAuthenticatedSession,
  subscribeSessionInfo,
  unregisterUnauthorizedHandler,
};
