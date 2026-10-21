import { useMemo } from "react";
import type { Group, Lodge, PublicUser } from "../../types";
import { errorTextClass } from "../ui";
import { GroupSelection } from "../GroupSelection";
import { LodgeSelection } from "../LodgeSelection";
import { UserSelection } from "../UserSelection";
import { normalizeSelectionIds } from "../lodgeSelectionUtils";

type Props = {
  lodges?: Lodge[] | null;
  groups?: Group[] | null;
  users?: PublicUser[] | null;
  lodgeUsers?: PublicUser[] | null;
  selectedLodgeIds: string[];
  selectedGroupIds: string[];
  selectedUserIds: string[];
  onLodgeChange: (ids: string[]) => void;
  onGroupChange: (ids: string[]) => void;
  onUserChange: (ids: string[]) => void;
  clearServerField: (field: string) => void;
  errors: Record<string, string>;
  disabled: boolean;
  lodgesLoading?: boolean;
  groupsLoading?: boolean;
  usersLoading?: boolean;
  userSearchQuery?: string;
  onUserSearchQueryChange?: (value: string) => void;
};

export function EventAudienceFields({
  lodges,
  groups,
  users,
  lodgeUsers,
  selectedLodgeIds,
  selectedGroupIds,
  selectedUserIds,
  onLodgeChange,
  onGroupChange,
  onUserChange,
  clearServerField,
  errors,
  disabled,
  lodgesLoading = false,
  groupsLoading = false,
  usersLoading = false,
  userSearchQuery,
  onUserSearchQueryChange,
}: Props) {
  const explicitGroupIds = useMemo(
    () => new Set(normalizeSelectionIds(selectedGroupIds)),
    [selectedGroupIds],
  );

  const individualSet = useMemo(
    () => new Set(normalizeSelectionIds(selectedUserIds)),
    [selectedUserIds],
  );

  // Users belonging to any of the explicitly selected lodges
  const lodgeUserSet = useMemo(
    () => new Set((lodgeUsers ?? []).map((u) => String(u.matrikelnummer))),
    [lodgeUsers],
  );

  // Users belonging to any explicitly selected group
  const groupUserSet = useMemo(() => {
    const covered = new Set<string>();
    for (const group of groups ?? []) {
      if (!explicitGroupIds.has(String(group.id))) continue;
      for (const uid of group.userIds) covered.add(String(uid));
    }
    return covered;
  }, [explicitGroupIds, groups]);

  // Per-lodge user sets built from the lodgeId field on PublicUser
  const lodgeUsersById = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const user of users ?? []) {
      if (user.lodgeId == null) continue;
      const lid = String(user.lodgeId);
      if (!map.has(lid)) map.set(lid, new Set());
      map.get(lid)!.add(String(user.matrikelnummer));
    }
    return map;
  }, [users]);

  const explicitLodgeIds = useMemo(
    () => new Set(normalizeSelectionIds(selectedLodgeIds)),
    [selectedLodgeIds],
  );

  // Lodges that are not explicitly selected but whose members are all already
  // covered by the rest of the selection (other lodges, groups, individual
  // users). They are shown as checked/read-only and are not sent as an
  // explicit choice.
  const autoLodgeIds = useMemo(() => {
    const derived: string[] = [];
    for (const lodge of lodges ?? []) {
      const lid = String(lodge.id);
      if (explicitLodgeIds.has(lid)) continue;
      const lodgeUids = lodgeUsersById.get(lid);
      if (!lodgeUids || lodgeUids.size === 0) continue;
      if (
        [...lodgeUids].every(
          (uid) => lodgeUserSet.has(uid) || groupUserSet.has(uid) || individualSet.has(uid),
        )
      ) {
        derived.push(lid);
      }
    }
    return derived;
  }, [lodges, explicitLodgeIds, lodgeUsersById, lodgeUserSet, groupUserSet, individualSet]);

  // Groups whose every member is covered by the selected lodges → locked, cannot be deselected.
  // Groups covered only by individual user selections are NOT locked.
  const lockedGroupIds = useMemo(
    () =>
      (groups ?? [])
        .filter(
          (g) =>
            g.userIds.length > 0 &&
            g.userIds.every((uid) => lodgeUserSet.has(String(uid))),
        )
        .map((g) => String(g.id)),
    [groups, lodgeUserSet],
  );

  // Users to show as read-only in UserSelection:
  // - covered by lodge (always read-only)
  // - covered by a group but NOT individually selected
  // Users who are both group-covered AND individually selected remain interactive so
  // the individual selection can be removed to re-lock a group if needed.
  const derivedUserIds = useMemo(() => {
    return (users ?? [])
      .map((u) => String(u.matrikelnummer))
      .filter(
        (uid) =>
          lodgeUserSet.has(uid) ||
          (groupUserSet.has(uid) && !individualSet.has(uid)),
      );
  }, [lodgeUserSet, groupUserSet, individualSet, users]);

  return (
    <div className="space-y-2">
      {errors.audience ? <p className={errorTextClass}>{errors.audience}</p> : null}

      <LodgeSelection
        lodges={lodges}
        selectedIds={selectedLodgeIds}
        derivedSelectedIds={autoLodgeIds}
        onChange={(ids) => {
          clearServerField("audience");
          clearServerField("lodgeId");
          clearServerField("lodgeIds");
          // Strip auto-derived lodge IDs — they're not an explicit user choice
          onLodgeChange(ids.filter((id) => !autoLodgeIds.includes(id)));
        }}
        label="Välj loger"
        disabled={disabled}
        loading={lodgesLoading}
        name="event-lodge"
      />
      {errors.lodgeIds ? <p className={errorTextClass}>{errors.lodgeIds}</p> : null}

      <GroupSelection
        groups={groups}
        selectedIds={selectedGroupIds}
        derivedSelectedIds={lockedGroupIds}
        onChange={(ids) => {
          clearServerField("audience");
          clearServerField("groupIds");
          // Strip locked group IDs — they're not an explicit user choice
          const nonLocked = ids.filter((id) => !lockedGroupIds.includes(id));
          onGroupChange(nonLocked);
        }}
        disabled={disabled}
        loading={groupsLoading}
        name="event-groups"
      />
      {errors.groupIds ? <p className={errorTextClass}>{errors.groupIds}</p> : null}

      <UserSelection
        users={users}
        selectedIds={selectedUserIds}
        derivedSelectedIds={derivedUserIds}
        onChange={(ids) => {
          clearServerField("audience");
          clearServerField("userIds");
          onUserChange(ids);
        }}
        disabled={disabled}
        loading={usersLoading}
        searchQuery={userSearchQuery}
        onSearchQueryChange={onUserSearchQueryChange}
        name="event-users"
      />
      {errors.userIds ? <p className={errorTextClass}>{errors.userIds}</p> : null}
    </div>
  );
}

export default EventAudienceFields;
