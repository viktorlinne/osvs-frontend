import { useCallback, useEffect, useState } from "react";
import useFetch from "./useFetch";
import { listAllUsers } from "../services/users";
import type { PublicUser } from "../types";

type UseDebouncedUserSearchOptions = {
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
      // All matching members (every page), so pickers grouped by lodge show
      // every member without typing, not only the first page.
      listAllUsers({
        name: debouncedQuery || undefined,
        lodgeId,
        achievementId,
        officialId,
        accommodationAvailable,
      }).then((users) => ({ users })),
    );
  }, [
    accommodationAvailable,
    achievementId,
    debouncedQuery,
    lodgeId,
    officialId,
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
