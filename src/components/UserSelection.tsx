import { useMemo, useState } from "react";
import type { PublicUser } from "../types";
import { normalizeSelectionIds } from "./lodgeSelectionUtils";

export type UserSelectionProps = {
  users?: PublicUser[] | null;
  selectedIds?: Array<string | number> | null;
  derivedSelectedIds?: Array<string | number> | null;
  onChange: (ids: string[]) => void;
  label?: string;
  name?: string;
  disabled?: boolean;
  emptyLabel?: string;
  loading?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  searchPlaceholder?: string;
};

type LodgeGroup = {
  key: string;
  lodgeName: string;
  users: PublicUser[];
};

export function UserSelection({
  users,
  selectedIds,
  derivedSelectedIds,
  onChange,
  label = "Välj användare",
  name = "user-selection",
  disabled = false,
  emptyLabel = "Inga användare",
  loading = false,
  searchQuery,
  onSearchQueryChange,
  searchPlaceholder = "Sök på namn...",
}: UserSelectionProps) {
  const explicitIds = normalizeSelectionIds(selectedIds);
  const derivedIds = normalizeSelectionIds(derivedSelectedIds);
  const mergedSelectedIds = useMemo(
    () => Array.from(new Set([...explicitIds, ...derivedIds])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedIds, derivedSelectedIds],
  );

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const groups = useMemo<LodgeGroup[]>(() => {
    const map = new Map<string, LodgeGroup>();
    for (const user of users ?? []) {
      const key = user.lodgeId != null ? String(user.lodgeId) : "none";
      if (!map.has(key)) {
        map.set(key, {
          key,
          lodgeName: user.lodgeName ?? "Ingen loge",
          users: [],
        });
      }
      map.get(key)!.users.push(user);
    }
    // lodges in insertion order, "none" last
    const entries = Array.from(map.values());
    const noneIndex = entries.findIndex((g) => g.key === "none");
    if (noneIndex > 0) {
      entries.push(entries.splice(noneIndex, 1)[0]);
    }
    return entries;
  }, [users]);

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleUser(userId: number, checked: boolean) {
    const value = String(userId);
    const next = new Set(mergedSelectedIds);
    if (checked) next.add(value);
    else next.delete(value);
    // only emit explicit (non-derived) ids
    const nextExplicit = Array.from(next).filter((id) => !derivedIds.includes(id) || id === value);
    onChange(nextExplicit);
  }

  const hasUsers = (users ?? []).length > 0;

  return (
    <div className="mb-4 w-full">
      <p className="ui-label">{label}</p>

      {onSearchQueryChange ? (
        <label htmlFor={`${name}-search`} className="sr-only">
          Sök användare
        </label>
      ) : null}
      {onSearchQueryChange ? (
        <input
          id={`${name}-search`}
          type="search"
          value={searchQuery ?? ""}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="ui-input mb-2 w-full"
          disabled={disabled}
        />
      ) : null}

      {loading && <div className="py-2 text-sm text-neutral-600">Laddar...</div>}

      {!loading && !hasUsers && (
        <div className="py-2 text-sm text-neutral-600">{emptyLabel}</div>
      )}

      {!loading && hasUsers && (
        <div className="flex flex-col gap-1">
          {groups.map((group) => {
            const isOpen = expandedGroups.has(group.key);
            const selectedInGroup = group.users.filter((u) =>
              mergedSelectedIds.includes(String(u.matrikelnummer)),
            ).length;

            return (
              <div key={group.key} className="rounded-md border border-neutral-200">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <span>{group.lodgeName}</span>
                  <span className="flex items-center gap-2 text-xs text-neutral-500">
                    {selectedInGroup > 0 && (
                      <span className="rounded-full bg-primary-100 px-2 py-0.5 font-medium text-primary-700">
                        {selectedInGroup} Vald{selectedInGroup !== 1 ? "a" : ""}
                      </span>
                    )}
                    <span>{isOpen ? "↓" : "↑"}</span>
                  </span>
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-1 border-t border-neutral-200 px-3 py-2">
                    {group.users.map((user) => {
                      const value = String(user.matrikelnummer);
                      const isChecked = mergedSelectedIds.includes(value);
                      const isReadOnly =
                        derivedIds.includes(value) && !explicitIds.includes(value);
                      const isDisabled = disabled || isReadOnly;
                      const inputId = `${name}-${user.matrikelnummer}`;

                      return (
                        <label
                          key={user.matrikelnummer}
                          htmlFor={inputId}
                          className={`inline-flex items-center gap-2 rounded px-2 py-1 text-sm text-neutral-700 ${
                            isDisabled ? "opacity-60" : "hover:bg-neutral-50"
                          }`}
                        >
                          <input
                            id={inputId}
                            type="checkbox"
                            name={name}
                            value={value}
                            checked={isChecked}
                            disabled={isDisabled}
                            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                            onChange={(e) => toggleUser(user.matrikelnummer, e.target.checked)}
                          />
                          <span>{user.firstname} {user.lastname}</span>
                          {isReadOnly && (
                            <span className="text-xs text-neutral-500">via annat val</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserSelection;
