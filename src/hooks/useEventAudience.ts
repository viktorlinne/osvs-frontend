import { useCallback, useEffect, useMemo, useState } from "react";
import useFetch from "./useFetch";
import { listAllUsers } from "../services/users";
import type { PublicUser } from "../types";

type UseEventAudienceOptions = {
  enabled?: boolean;
  /** Every lodge selected in the audience; members of all of them are loaded. */
  selectedLodgeIds?: number[];
};

const NO_LODGES: number[] = [];

export function useEventAudience({
  enabled = true,
  selectedLodgeIds = NO_LODGES,
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

  // Stable key so a new array with the same ids does not refetch.
  const lodgeIdsKey = useMemo(
    () =>
      Array.from(
        new Set(selectedLodgeIds.filter((id) => Number.isFinite(id) && id > 0)),
      )
        .sort((a, b) => a - b)
        .join(","),
    [selectedLodgeIds],
  );

  useEffect(() => {
    const lodgeIds = lodgeIdsKey ? lodgeIdsKey.split(",").map(Number) : [];
    if (!enabled || lodgeIds.length === 0) {
      setLodgeUsers(null);
      return;
    }

    runLodgeUsers(() =>
      Promise.all(lodgeIds.map((lodgeId) => listAllUsers({ lodgeId }))).then(
        (perLodge) => {
          // Merge members of all selected lodges, deduped by matrikelnummer.
          const byId = new Map<number, PublicUser>();
          for (const users of perLodge) {
            for (const user of users) byId.set(user.matrikelnummer, user);
          }
          return { users: Array.from(byId.values()) };
        },
      ),
    ).catch(() => {
      /* useFetch handles errors */
    });
  }, [enabled, runLodgeUsers, lodgeIdsKey, setLodgeUsers]);

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
