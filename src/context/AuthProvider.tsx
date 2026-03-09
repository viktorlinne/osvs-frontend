import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authService from "../services/auth";
import {
  clearAuthSession,
  getSessionInfo,
  setAuthenticatedSession,
  subscribeSessionInfo,
} from "../services/globalAuth";
import { type AuthContextValue, AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
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
      } catch {
        if (mounted) clearUser();
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

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    clearUser();
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
    } catch {
      clearUser();
      return null;
    }
  }, [clearUser]);

  const value = useMemo(
    () => ({ user, session, loading, login, logout, refresh, clearUser }),
    [user, session, loading, login, logout, refresh, clearUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
