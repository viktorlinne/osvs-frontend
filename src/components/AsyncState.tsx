import type { ReactNode } from "react";

type AsyncStateProps = {
  loading: boolean;
  error?: boolean;
  empty?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  retryLabel?: string;
  emptyMessage?: ReactNode;
  loadingFallback?: ReactNode;
  children?: ReactNode;
};

export function AsyncState({
  loading,
  error = false,
  empty = false,
  onRetry,
  errorMessage = "Innehållet kunde inte laddas.",
  retryLabel = "Försök igen",
  emptyMessage,
  loadingFallback,
  children,
}: AsyncStateProps) {
  if (loading) {
    return loadingFallback ?? null;
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-between gap-3 rounded-md border border-danger-600/20 bg-danger-50 px-4 py-3 text-sm text-danger-700"
        role="alert"
      >
        <span>{errorMessage}</span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 font-medium underline underline-offset-2 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-600 focus-visible:ring-offset-2"
          >
            {retryLabel}
          </button>
        ) : null}
      </div>
    );
  }

  if (empty && emptyMessage) {
    return <>{emptyMessage}</>;
  }

  return <>{children}</>;
}

export default AsyncState;
