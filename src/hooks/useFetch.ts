import { useCallback, useRef, useState } from "react";
import axios from "axios";
import { useError } from "../context";
import type { ApiError } from "../types";
import { isApiError } from "../types/api";
import { getApiErrorMessage, hasApiFieldErrors } from "../utils/apiErrors";

export default function useFetch<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { setError, clearError } = useError();
  // Several runs of one hook can overlap (e.g. a route param changes while
  // the previous load is still in flight). `loading` stays true until every
  // run has settled, and only the most recent run may write `data` /
  // `notFound`, so a slow stale response cannot overwrite newer state.
  const inFlightRef = useRef(0);
  const latestRunRef = useRef(0);

  const run = useCallback(
    async (fn: Promise<T> | (() => Promise<T>)) => {
      const runId = ++latestRunRef.current;
      const isLatest = () => runId === latestRunRef.current;
      inFlightRef.current += 1;
      setLoading(true);
      setNotFound(false);
      clearError();
      try {
        const result = typeof fn === "function" ? await fn() : await fn;
        if (isLatest()) setData(result ?? null);
        return result;
      } catch (e: unknown) {
        if (axios.isAxiosError(e) && e.response) {
          if (e.response.status === 401) {
            throw e;
          }
          const raw = e.response.data as ApiError | undefined;
          if (raw?.status === 404) {
            if (isLatest()) setNotFound(true);
          }
          else if (!hasApiFieldErrors(raw)) {
            setError(raw?.message ?? String(e));
          }
        } else if (isApiError(e)) {
          if (e.status === 404) {
            if (isLatest()) setNotFound(true);
          }
          else if (e.status === 401) {
            // handled globally via API unauthorized handler
          }
          else if (!hasApiFieldErrors(e)) {
            setError(getApiErrorMessage(e) ?? String(e));
          }
        } else if (e instanceof Error) {
          setError(e.message ?? String(e));
        } else {
          setError(String(e ?? "Begäran misslyckades"));
        }
        throw e;
      } finally {
        inFlightRef.current -= 1;
        if (inFlightRef.current === 0) setLoading(false);
      }
    },
    [clearError, setError]
  );

  const reset = useCallback(() => {
    setData(null);
    setNotFound(false);
    clearError();
  }, [clearError]);

  return { data, setData, loading, notFound, run, reset } as const;
}
