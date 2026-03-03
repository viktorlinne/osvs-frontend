import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, PageContainer, inputClass } from "../components";
import { useError } from "../context";
import { useAuth } from "../context/useAuth";
import useFetch from "../hooks/useFetch";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setError, clearError } = useError();
  const { run } = useFetch();
  const from = (
    location.state as
    | {
      from?: { pathname?: string; search?: string; hash?: string };
    }
    | undefined
  )?.from;
  const redirectTo = from?.pathname
    ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
    : "/posts";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      const user = await run(() => login(email, password));
      if (user) navigate(redirectTo, { replace: true });
      else setError("Login failed");
    } catch {
      // useFetch already sets friendly messages via global error
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer size="md" className="ui-page flex min-h-full items-center justify-center">
      <form onSubmit={submit} className="ui-card w-full max-w-md">
        <h2 className="ui-page-title mb-4">Logga in</h2>
        <label htmlFor="email" className="ui-label">
          Email
          <input
            id="email"
            name="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label htmlFor="password" className="ui-label mb-4 mt-3">
          Lösenord
          <input
            id="password"
            name="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <Button type="submit" disabled={loading}>
          {loading ? "Loggar in..." : "Logga in"}
        </Button>
      </form>
    </PageContainer>
  );
};
