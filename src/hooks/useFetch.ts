import { useCallback, useState } from "react";
import axios from "axios";
import { useError } from "../context";
import type { ApiError } from "../types";
import { isApiError } from "../types/api";

export default function useFetch<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { setError, clearError } = useError();

  const run = useCallback(
    async (fn: Promise<T> | (() => Promise<T>)) => {
      setLoading(true);
      setNotFound(false);
      clearError();
      try {
        const result = typeof fn === "function" ? await fn() : await fn;
        setData(result ?? null);
        return result;
      } catch (e: unknown) {
        if (axios.isAxiosError(e) && e.response) {
          const raw = e.response.data as ApiError | undefined;
          if (raw?.status === 404) setNotFound(true);
          else setError(raw?.message ?? String(e));
        } else if (isApiError(e)) {
          if (e.status === 404) setNotFound(true);
          else setError(e.message ?? String(e));
        } else if (e instanceof Error) {
          setError(e.message ?? String(e));
        } else {
          setError(String(e ?? "Request failed"));
        }
        throw e;
      } finally {
        setLoading(false);
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
