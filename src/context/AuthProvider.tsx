import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as authService from "../services/auth";
import { reportGlobalError } from "../services/globalError";
import {
  clearAuthSession,
  getSessionInfo,
  setAuthenticatedSession,
  subscribeSessionInfo,
} from "../services/globalAuth";
import { type AuthContextValue, AuthContext } from "./AuthContext";

function isUnauthorizedError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    (error as { status?: unknown }).status === 401
  );
}

/**
 * Message for a failed session check that is not a real logout: rate limited
 * (429), server unreachable/timed out (status 0, see fetchData) or a server
 * error (5xx, e.g. the backend restarting during a deploy). Without it the
 * member is sent to the login page with no hint why.
 */
function sessionCheckErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const { status, message } = error as { status?: unknown; message?: unknown };
  if (typeof status !== "number" || typeof message !== "string" || !message) {
    return null;
  }
  if (status === 429 || status === 0 || status >= 500) return message;
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const userRef = useRef<AuthContextValue["user"]>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);
  const [session, setSession] = useState<AuthContextValue["session"]>(() =>
    getSessionInfo(),
  );
  const [loading, setLoading] = useState(true);

  const clearUser = useCallback(() => {
    setUser(null);
    clearAuthSession();
  }, []);

  useEffect(() => subscribeSessionInfo(setSession), []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const authState = await authService.restoreSession();
        if (!mounted) return;

        setUser(authState.user);
        if (authState.user && authState.session) {
          setAuthenticatedSession(authState.session);
        } else {
          clearAuthSession();
        }
      } catch (error) {
        if (!mounted) return;
        // The user could not be determined. Nothing is revoked server-side:
        // on e.g. 429 the session cookies stay valid, so a later reload
        // restores the session. Tell the user why.
        clearUser();
        const message = sessionCheckErrorMessage(error);
        if (message) reportGlobalError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [clearUser]);

  const login = useCallback(async (email: string, password: string) => {
    const authState = await authService.login({ email, password });
    setUser(authState.user);
    if (authState.user && authState.session) {
      setAuthenticatedSession(authState.session);
    } else {
      clearAuthSession();
    }
    return authState.user;
  }, []);

  // Local state is always cleared. A failure is rethrown so the caller can
  // tell the member that the server did not confirm the logout (the session
  // cookies may still be valid on this device).
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearUser();
    }
  }, [clearUser]);

  const refresh = useCallback(async () => {
    try {
      const authState = await authService.restoreSession();
      setUser(authState.user);
      if (authState.user && authState.session) {
        setAuthenticatedSession(authState.session);
      } else {
        clearAuthSession();
      }
      return authState.user;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearUser();
        return null;
      }
      // Not a logout (rate limited, network, server error): keep current state.
      const message = sessionCheckErrorMessage(error);
      if (message) reportGlobalError(message);
      return userRef.current;
    }
  }, [clearUser]);

  const value = useMemo(
    () => ({ user, session, loading, login, logout, refresh, clearUser }),
    [user, session, loading, login, logout, refresh, clearUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
