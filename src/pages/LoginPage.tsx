import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, PageContainer, inputClass } from "../components";
import { useError } from "../context";
import { useAuth } from "../context/useAuth";
import useFetch from "../hooks/useFetch";
import { isApiError } from "../types/api";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      else setError("Kunde inte logga in");
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        setError("Felaktig e-postadress eller lösenord");
      }
      // Other errors are handled by useFetch via global error
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      size="md"
      className="ui-page flex min-h-full items-center justify-center"
    >
      <form onSubmit={submit} className="ui-card w-full max-w-md">
        <p className="ui-chapter mb-3">Ordensamfundet VS</p>
        <h2 className="ui-section-title mb-5">Logga in</h2>
        <label htmlFor="email" className="ui-label">
          Email <span aria-hidden="true" className="text-danger-600">*</span>
          <input
            id="email"
            name="email"
            className={`${inputClass} mt-1.5`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label htmlFor="password" className="ui-label mb-4 mt-3">
          Lösenord <span aria-hidden="true" className="text-danger-600">*</span>
          <div className="relative mt-1.5">
            <input
              id="password"
              name="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-600 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1"
              aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </label>
        <div className="mb-4 text-right">
          <Link to="/forgot-password" className="ui-link text-sm">
            Glömt lösenord?
          </Link>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Loggar in..." : "Logga in"}
        </Button>
      </form>
    </PageContainer>
  );
};
