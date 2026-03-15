import React, { useCallback, useEffect, useMemo, useState } from "react";
import ErrorContext from "./ErrorContext";
import {
  registerGlobalErrorHandler,
  unregisterGlobalErrorHandler,
} from "../services/globalError";

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setErrorState] = useState<string | null>(null);

  const setError = useCallback((msg: string | null) => {
    setErrorState(msg);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  useEffect(() => {
    registerGlobalErrorHandler(setError);
    return () => unregisterGlobalErrorHandler();
  }, [setError]);

  // Auto-dismiss any error after 10 seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setErrorState(null), 10000);
    return () => clearTimeout(t);
  }, [error]);

  const value = useMemo(
    () => ({ error, setError, clearError }),
    [error, setError, clearError]
  );

  return (
    <ErrorContext.Provider value={value}>
      {error ? (
        <div className="pointer-events-none fixed top-10 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 px-4">
          <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="pointer-events-auto flex items-start gap-3 rounded-md bg-red-600 p-3 text-white shadow transition"
          >
            <p className="flex-1 text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={clearError}
              className="rounded px-2 py-1 text-sm font-medium underline underline-offset-2 transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-600"
              aria-label="Stäng felmeddelandet"
            >
              Stäng
            </button>
          </div>
        </div>
      ) : null}
      {children}
    </ErrorContext.Provider>
  );
}

export default ErrorProvider;
