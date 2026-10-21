import { useCallback, useEffect, useMemo, useState } from "react";
import useFetch from "./useFetch";
import { listAllUsers } from "../services/users";
import type { PublicUser } from "../types";

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
      // Every member (all pages): the audience picker groups members by lodge
      // and must offer all of them, not only the first page.
      listAllUsers({ name: debouncedUserQuery || undefined }).then((users) => ({
        users,
      })),
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
      listAllUsers({ lodgeId: selectedLodgeId }).then((users) => ({ users })),
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
