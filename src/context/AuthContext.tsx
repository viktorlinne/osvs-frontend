import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as authService from "../services/auth";

type User = Record<string, unknown> | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load current user on mount
    let mounted = true;
    (async () => {
      try {
        const u = await authService.me();
        if (mounted) setUser(u as User);
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

  async function login(email: string, password: string) {
    const u = await authService.login({ email, password });
    setUser(u as User);
    return u as User;
  }

  async function logout() {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    setUser(null);
  }

  async function refresh() {
    try {
      const u = await authService.me();
      setUser(u as User);
      return u as User;
    } catch {
      setUser(null);
      return null;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthProvider;
