import { useMemo } from "react";
import type { Group, Lodge, PublicUser } from "../../types";
import { errorTextClass } from "../ui";
import { GroupSelection } from "../GroupSelection";
import { SingleLodgeSelection } from "../SingleLodgeSelection";
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
}: Props) {
  const explicitGroupIds = useMemo(
    () => new Set(normalizeSelectionIds(selectedGroupIds)),
    [selectedGroupIds],
  );
  const explicitUserIds = useMemo(
    () => new Set(normalizeSelectionIds(selectedUserIds)),
    [selectedUserIds],
  );
  const selectedLodgeUserIds = useMemo(() => {
    return new Set(
      (lodgeUsers ?? [])
        .map((user) => String(user.matrikelnummer))
        .filter((value) => value.length > 0),
    );
  }, [lodgeUsers]);

  const explicitGroupUserIds = useMemo(() => {
    const covered = new Set<string>();
    for (const group of groups ?? []) {
      if (!explicitGroupIds.has(String(group.id))) continue;
      for (const userId of group.userIds) {
        covered.add(String(userId));
      }
    }
    return covered;
  }, [explicitGroupIds, groups]);

  const derivedGroupIds = useMemo(() => {
    return (groups ?? [])
      .filter((group) => {
        const groupId = String(group.id);
        if (explicitGroupIds.has(groupId) || group.userIds.length === 0) {
          return false;
        }

        const coveredByOtherSelections = new Set<string>([
          ...selectedLodgeUserIds,
          ...explicitUserIds,
        ]);

        for (const otherGroup of groups ?? []) {
          const otherGroupId = String(otherGroup.id);
          if (otherGroupId === groupId || !explicitGroupIds.has(otherGroupId)) {
            continue;
          }
          for (const userId of otherGroup.userIds) {
            coveredByOtherSelections.add(String(userId));
          }
        }

        return group.userIds.every((userId) =>
          coveredByOtherSelections.has(String(userId)),
        );
      })
      .map((group) => String(group.id));
  }, [explicitGroupIds, explicitUserIds, groups, selectedLodgeUserIds]);

  const derivedUserIds = useMemo(() => {
    const coveredByOtherSelections = new Set<string>([
      ...selectedLodgeUserIds,
      ...explicitGroupUserIds,
    ]);

    return (users ?? [])
      .map((user) => String(user.matrikelnummer))
      .filter(
        (userId) =>
          coveredByOtherSelections.has(userId) && !explicitUserIds.has(userId),
      );
  }, [explicitGroupUserIds, explicitUserIds, selectedLodgeUserIds, users]);

  return (
    <div className="space-y-2">
      {errors.audience ? <p className={errorTextClass}>{errors.audience}</p> : null}

      <SingleLodgeSelection
        lodges={lodges}
        selectedIds={selectedLodgeIds}
        onChange={(ids) => {
          clearServerField("audience");
          clearServerField("lodgeId");
          clearServerField("lodgeIds");
          onLodgeChange(ids);
        }}
        label="Välj loge"
        disabled={disabled}
        loading={lodgesLoading}
        name="event-lodge"
      />
      {errors.lodgeIds ? <p className={errorTextClass}>{errors.lodgeIds}</p> : null}

      <GroupSelection
        groups={groups}
        selectedIds={selectedGroupIds}
        derivedSelectedIds={derivedGroupIds}
        onChange={(ids) => {
          clearServerField("audience");
          clearServerField("groupIds");
          onGroupChange(ids);
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
        name="event-users"
      />
      {errors.userIds ? <p className={errorTextClass}>{errors.userIds}</p> : null}
    </div>
  );
}

export default EventAudienceFields;
