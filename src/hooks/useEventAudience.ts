import { useCallback, useEffect, useMemo, useState } from "react";
import useFetch from "./useFetch";
import { listUsersPage } from "../services/users";
import type { PublicUser } from "../types";

const USER_PAGE_SIZE = 50;

type UseEventAudienceOptions = {
  enabled?: boolean;
  selectedLodgeId?: number | null;
};

export function useEventAudience({
  enabled = true,
  selectedLodgeId = null,
}: UseEventAudienceOptions = {}) {
  const {
    run: runUsers,
    data: usersPage,
    loading: usersLoading,
  } = useFetch<{ users: PublicUser[] }>();
  const {
    run: runLodgeUsers,
    data: lodgeUsersPage,
    setData: setLodgeUsers,
    loading: lodgeUsersLoading,
  } = useFetch<{ users: PublicUser[] }>();

  const [userQuery, setUserQuery] = useState("");
  const [debouncedUserQuery, setDebouncedUserQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUserQuery(userQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [userQuery]);

  const loadUsers = useCallback(() => {
    if (!enabled) return Promise.resolve({ users: [] as PublicUser[] });
    return runUsers(() =>
      listUsersPage({
        name: debouncedUserQuery || undefined,
        page: 1,
        pageSize: USER_PAGE_SIZE,
      }).then((response) => ({ users: response.users })),
    );
  }, [debouncedUserQuery, enabled, runUsers]);

  useEffect(() => {
    if (!enabled) return;
    loadUsers().catch(() => {
      /* useFetch handles errors */
    });
  }, [enabled, loadUsers]);

  useEffect(() => {
    if (!enabled || !selectedLodgeId) {
      setLodgeUsers(null);
      return;
    }

    runLodgeUsers(() =>
      listUsersPage({
        lodgeId: selectedLodgeId,
        page: 1,
        pageSize: USER_PAGE_SIZE,
      }).then((response) => ({ users: response.users })),
    ).catch(() => {
      /* useFetch handles errors */
    });
  }, [enabled, runLodgeUsers, selectedLodgeId, setLodgeUsers]);

  const users = useMemo(() => usersPage?.users ?? [], [usersPage?.users]);
  const lodgeUsers = useMemo(
    () => lodgeUsersPage?.users ?? [],
    [lodgeUsersPage?.users],
  );

  return {
    users,
    lodgeUsers,
    usersLoading,
    lodgeUsersLoading,
    userQuery,
    setUserQuery,
  };
}

export default useEventAudience;
