import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button, PageContainer, errorTextClass, inputClass } from "../components";
import useError from "../context/useError";
import {
  completePasswordAction,
  verifyPasswordAction,
  type PasswordActionStatus,
} from "../services/auth";
import { applyApiFieldErrors, getApiErrorMessage } from "../utils/apiErrors";

type SetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

const TOKEN_STORAGE_KEY = "osvs-password-action-token";

function readTokenFromHash(): string {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash).get("token")?.trim() ?? "";
}

function readStoredToken(): string {
  return window.sessionStorage.getItem(TOKEN_STORAGE_KEY)?.trim() ?? "";
}

function storeToken(token: string) {
  window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

function clearStoredToken() {
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

function clearTokenFromUrl() {
  window.history.replaceState(
    {},
    document.title,
    `${window.location.pathname}${window.location.search}`,
  );
}

export const SetPasswordPage = () => {
  const { setError, clearError } = useError();
  const [token, setToken] = useState("");
  const [action, setAction] = useState<PasswordActionStatus | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    clearErrors,
    setError: setFieldError,
    formState: { errors },
  } = useForm<SetPasswordFormValues>({
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");

  useEffect(() => {
    const hashToken = readTokenFromHash();
    const nextToken = hashToken || readStoredToken();
    clearTokenFromUrl();
    clearError();

    if (!nextToken) {
      clearStoredToken();
      setLinkError("Länken är ogiltig eller har gått ut.");
      setVerifying(false);
      return;
    }

    if (hashToken) {
      storeToken(hashToken);
    }

    setToken(nextToken);

    const load = async () => {
      try {
        setVerifying(true);
        const data = await verifyPasswordAction(nextToken);
        setAction(data);
        setLinkError(null);
      } catch (error: unknown) {
        clearStoredToken();
        setLinkError(
          getApiErrorMessage(error) ?? "Länken är ogiltig eller har gått ut.",
        );
      } finally {
        setVerifying(false);
      }
    };

    void load();
  }, [clearError]);

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setLinkError("Länken är ogiltig eller har gått ut.");
      return;
    }

    clearError();
    clearErrors();
    setSubmitting(true);

    try {
      await completePasswordAction(token, values.password);
      clearStoredToken();
      setCompleted(true);
      setLinkError(null);
    } catch (error: unknown) {
      if (applyApiFieldErrors(error, setFieldError)) return;

      const message =
        getApiErrorMessage(error) ?? "Kunde inte uppdatera lösenordet";
      if (/länk/i.test(message)) {
        clearStoredToken();
        setLinkError(message);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  });

  const actionLabel =
    action?.purpose === "SET_PASSWORD"
      ? "Välj ditt lösenord"
      : "Återställ lösenord";
  const expiresAt = action?.expiresAt
    ? new Date(action.expiresAt).toLocaleString("sv-SE", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : null;

  return (
    <PageContainer
      size="md"
      className="ui-page flex min-h-full items-center justify-center"
    >
      <div className="ui-card w-full max-w-md">
        <p className="ui-chapter mb-3">Ordensamfundet VS</p>
        <h2 className="ui-section-title mb-3">
          {completed ? "Lösenord klart" : actionLabel}
        </h2>

        {verifying ? (
          <p className="text-sm text-neutral-600">Verifierar länken…</p>
        ) : linkError ? (
          <div className="space-y-4">
            <p className="rounded-md border border-warning bg-warning-pale px-4 py-3 text-sm text-neutral-700">
              {linkError}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/forgot-password" className="ui-btn ui-btn-primary">
                Ny länk
              </Link>
              <Link to="/login" className="ui-btn ui-btn-secondary">
                Till inloggning
              </Link>
            </div>
          </div>
        ) : completed ? (
          <div className="space-y-4">
            <p
              role="status"
              className="rounded-md border border-success-600/20 bg-success-50 px-4 py-3 text-sm text-success-700"
            >
              Lösenordet är sparat. Du kan nu logga in med ditt nya lösenord.
            </p>
            <Link to="/login" className="ui-btn ui-btn-primary">
              Till inloggning
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <p className="text-sm text-neutral-600">
              {action?.purpose === "SET_PASSWORD"
                ? "Kontot är klart att aktiveras. Välj ett lösenord för att komma igång."
                : "Välj ett nytt lösenord för ditt konto."}
            </p>
            {action?.email ? (
              <p className="text-xs text-neutral-500">
                Gäller för <strong>{action.email}</strong>
                {expiresAt ? ` till ${expiresAt}` : ""}
              </p>
            ) : null}

            <div>
              <label htmlFor="password" className="ui-label">
                Nytt lösenord{" "}
                <span aria-hidden="true" className="text-danger-600">*</span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                {...register("password", {
                  validate: {
                    required: (value) =>
                      value.length > 0 || "Lösenord är obligatoriskt",
                    minLength: (value) =>
                      value.length >= 6 || "Lösenordet måste vara minst 6 tecken",
                  },
                })}
              />
              {errors.password ? (
                <p className={errorTextClass}>{errors.password.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="ui-label">
                Bekräfta lösenord{" "}
                <span aria-hidden="true" className="text-danger-600">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                {...register("confirmPassword", {
                  validate: {
                    required: (value) =>
                      value.length > 0 || "Bekräfta lösenordet",
                    match: (value) =>
                      value === passwordValue || "Lösenorden matchar inte",
                  },
                })}
              />
              {errors.confirmPassword ? (
                <p className={errorTextClass}>
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sparar..." : "Spara lösenord"}
              </Button>
              <Link to="/login" className="ui-btn ui-btn-secondary">
                Avbryt
              </Link>
            </div>
          </form>
        )}
      </div>
    </PageContainer>
  );
};
