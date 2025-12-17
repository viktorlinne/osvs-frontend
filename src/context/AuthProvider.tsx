import { useEffect, useState, type ReactNode } from "react";
import * as authService from "../services/auth";
import { type AuthContextValue, AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthContextValue["user"]>(null);
    const [loading, setLoading] = useState(true);

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

    async function login(email: string, password: string) {
        const u = await authService.login({ email, password });
        setUser(u);
        return u;
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
            setUser(u);
            return u;
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

export default AuthProvider;
