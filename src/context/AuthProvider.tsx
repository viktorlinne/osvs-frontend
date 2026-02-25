import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authService from "../services/auth";
import { type AuthContextValue, AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [loading, setLoading] = useState(true);

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await authService.me();
        if (mounted) setUser(u);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authService.login({ email, password });
    setUser(u);
    return u;
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
      const u = await authService.me();
      setUser(u);
      return u;
    } catch {
      clearUser();
      return null;
    }
  }, [clearUser]);

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh, clearUser }),
    [user, loading, login, logout, refresh, clearUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
