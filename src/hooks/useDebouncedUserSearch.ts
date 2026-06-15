import { useCallback, useEffect, useState } from "react";
import useFetch from "./useFetch";
import { listUsersPage } from "../services/users";
import type { PublicUser } from "../types";

const DEFAULT_PAGE_SIZE = 50;

type UseDebouncedUserSearchOptions = {
  pageSize?: number;
  debounceMs?: number;
  lodgeId?: number | null;
  achievementId?: number | null;
  officialId?: number | null;
  accommodationAvailable?: boolean | null;
};

export function useDebouncedUserSearch(
  options: UseDebouncedUserSearchOptions = {},
) {
  const {
    pageSize = DEFAULT_PAGE_SIZE,
    debounceMs = 400,
    lodgeId = null,
    achievementId = null,
    officialId = null,
    accommodationAvailable = null,
  } = options;
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { run, data, loading } = useFetch<{ users: PublicUser[] }>();
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const load = useCallback(() => {
    setFetchError(false);
    return run(() =>
      listUsersPage({
        name: debouncedQuery || undefined,
        lodgeId,
        achievementId,
        officialId,
        accommodationAvailable,
        page: 1,
        pageSize,
      }).then((response) => ({ users: response.users })),
    );
  }, [
    accommodationAvailable,
    achievementId,
    debouncedQuery,
    lodgeId,
    officialId,
    pageSize,
    run,
  ]);

  useEffect(() => {
    load().catch(() => setFetchError(true));
  }, [load]);

  return {
    users: data?.users ?? [],
    query,
    setQuery,
    loading,
    fetchError,
    reload: load,
  };
}

export default useDebouncedUserSearch;
