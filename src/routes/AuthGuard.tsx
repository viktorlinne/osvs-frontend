import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context";
import * as authService from "../services/auth";
import {
  getSessionInfo,
  reportUnauthorized,
  setAuthenticatedSession,
} from "../services/globalAuth";

type Props = {
  children: React.ReactElement;
  /** Required roles - user must have at least one of these to access */
  roles?: string | string[];
};

const HEARTBEAT_INTERVAL_MS = 60_000;
const HEARTBEAT_EXPIRY_BUFFER_MS = 5_000;
const SCROLL_ACTIVITY_THROTTLE_MS = 1_000;

function isUnauthorizedError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  return (error as { status?: unknown }).status === 401;
}

function getSessionExpiryMs(fallbackExpiresAt: string) {
  const currentSession = getSessionInfo();
  const expiresAt = currentSession?.inactivityExpiresAt ?? fallbackExpiresAt;
  return Date.parse(expiresAt);
}

function SessionHeartbeat({ expiresAt }: { expiresAt: string }) {
  const location = useLocation();
  const activitySinceHeartbeatRef = useRef(true);
  const heartbeatInFlightRef = useRef(false);
  const lastScrollActivityAtRef = useRef(0);

  useEffect(() => {
    activitySinceHeartbeatRef.current = true;
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const markActivity = () => {
      activitySinceHeartbeatRef.current = true;
    };

    const onScroll = () => {
      const now = Date.now();
      if (now - lastScrollActivityAtRef.current < SCROLL_ACTIVITY_THROTTLE_MS) {
        return;
      }
      lastScrollActivityAtRef.current = now;
      markActivity();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (getSessionExpiryMs(expiresAt) <= Date.now()) {
        reportUnauthorized({
          status: 401,
          url: "/auth/heartbeat",
          source: "heartbeat-visibility-expired",
        });
      }
    };

    window.addEventListener("pointerdown", markActivity, { passive: true });
    window.addEventListener("keydown", markActivity);
    window.addEventListener("touchstart", markActivity, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("focus", markActivity);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pointerdown", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("touchstart", markActivity);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("focus", markActivity);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [expiresAt]);

  useEffect(() => {
    let timeoutId: number | null = null;

    const reportIfExpired = () => {
      const msUntilExpiry = getSessionExpiryMs(expiresAt) - Date.now();
      if (msUntilExpiry > 0) {
        timeoutId = window.setTimeout(reportIfExpired, msUntilExpiry);
        return;
      }

      if (heartbeatInFlightRef.current) {
        timeoutId = window.setTimeout(reportIfExpired, 1_000);
        return;
      }

      reportUnauthorized({
        status: 401,
        url: "/auth/heartbeat",
        source: "heartbeat-local-expired",
      });
    };

    const msUntilExpiry = getSessionExpiryMs(expiresAt) - Date.now();
    if (msUntilExpiry <= 0) {
      reportIfExpired();
      return;
    }

    timeoutId = window.setTimeout(reportIfExpired, msUntilExpiry);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [expiresAt]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;

    const runHeartbeat = async () => {
      if (cancelled || heartbeatInFlightRef.current) return;
      if (document.visibilityState !== "visible") return;

      if (getSessionExpiryMs(expiresAt) <= Date.now()) {
        reportUnauthorized({
          status: 401,
          url: "/auth/heartbeat",
          source: "heartbeat-check-expired",
        });
        return;
      }

      if (!activitySinceHeartbeatRef.current) return;

      heartbeatInFlightRef.current = true;
      try {
        const nextSession = await authService.heartbeat();
        if (cancelled) return;
        setAuthenticatedSession(nextSession);
        activitySinceHeartbeatRef.current = false;
      } catch (error) {
        if (!cancelled && isUnauthorizedError(error)) {
          reportUnauthorized({
            status: 401,
            url: "/auth/heartbeat",
            source: "heartbeat-401",
          });
        }
      } finally {
        heartbeatInFlightRef.current = false;
      }
    };

    const scheduleNextCheck = () => {
      if (cancelled) return;

      const remainingMs = getSessionExpiryMs(expiresAt) - Date.now();
      if (remainingMs <= 0) {
        reportUnauthorized({
          status: 401,
          url: "/auth/heartbeat",
          source: "heartbeat-schedule-expired",
        });
        return;
      }

      const nextDelay = Math.min(
        HEARTBEAT_INTERVAL_MS,
        Math.max(1_000, remainingMs - HEARTBEAT_EXPIRY_BUFFER_MS),
      );

      timeoutId = window.setTimeout(async () => {
        await runHeartbeat();
        scheduleNextCheck();
      }, nextDelay);
    };

    scheduleNextCheck();

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [expiresAt]);

  return null;
}

export default function AuthGuard({ children, roles }: Props) {
  const { user, session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles) {
    const required = Array.isArray(roles) ? roles : [roles];
    const userRoles = user.roles ?? [];
    const has = required.some((role) => userRoles.includes(role));
    if (!has) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
  }

  return (
    <>
      {session ? <SessionHeartbeat expiresAt={session.inactivityExpiresAt} /> : null}
      {children}
    </>
  );
}
