import { useEffect, useId, useMemo, useState } from "react";
import type { PublicUser } from "../types";
import { normalizeSelectionIds } from "./lodgeSelectionUtils";
import { Popover, PopoverContent, PopoverTrigger } from "./shadcn/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./shadcn/command";

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

function fullName(user: PublicUser) {
  return `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() || `#${user.matrikelnummer}`;
}

function matchesQuery(user: PublicUser, tokens: string[]) {
  if (tokens.length === 0) return true;
  const haystack = [
    user.firstname,
    user.lastname,
    String(user.matrikelnummer),
    user.lodgeName ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase("sv-SE");
  return tokens.every((token) => haystack.includes(token));
}

/**
 * Member picker: a searchable combobox (Radix Popover + cmdk) grouped by
 * lodge, with the explicit selection shown as removable chips.
 *
 * Keyboard: Enter/Space on the trigger opens it, type to filter, ↑/↓ to move,
 * Enter toggles the highlighted member, Escape closes and returns focus.
 *
 * `derivedSelectedIds` are members already covered by another choice (lodge
 * or group): shown as selected but read-only, and never emitted by onChange.
 * When `onSearchQueryChange` is given the query is controlled by the caller
 * (server-side search); the list is additionally filtered client-side so it
 * reacts instantly while the server request is debounced.
 */
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
  searchPlaceholder = "Sök på namn…",
}: UserSelectionProps) {
  const labelId = useId();
  const triggerTextId = useId();
  const explicitIds = useMemo(() => normalizeSelectionIds(selectedIds), [selectedIds]);
  const derivedIds = useMemo(
    () => normalizeSelectionIds(derivedSelectedIds),
    [derivedSelectedIds],
  );
  const mergedSelectedIds = useMemo(
    () => new Set([...explicitIds, ...derivedIds]),
    [explicitIds, derivedIds],
  );

  const [open, setOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState("");
  const query = onSearchQueryChange ? (searchQuery ?? "") : localQuery;
  function setQuery(value: string) {
    if (onSearchQueryChange) onSearchQueryChange(value);
    else setLocalQuery(value);
  }

  // Remember every member we have seen, so chips keep their names even when a
  // (server-side) search no longer returns the selected member.
  const [knownUsers, setKnownUsers] = useState<Map<string, PublicUser>>(() => new Map());
  useEffect(() => {
    if (!users || users.length === 0) return;
    setKnownUsers((prev) => {
      const next = new Map(prev);
      for (const user of users) next.set(String(user.matrikelnummer), user);
      return next;
    });
  }, [users]);

  const tokens = useMemo(
    () =>
      query
        .trim()
        .toLocaleLowerCase("sv-SE")
        .split(/\s+/)
        .filter(Boolean),
    [query],
  );

  const groups = useMemo<LodgeGroup[]>(() => {
    const map = new Map<string, LodgeGroup>();
    for (const user of users ?? []) {
      if (!matchesQuery(user, tokens)) continue;
      const key = user.lodgeId != null ? String(user.lodgeId) : "none";
      let group = map.get(key);
      if (!group) {
        group = { key, lodgeName: user.lodgeName ?? "Ingen loge", users: [] };
        map.set(key, group);
      }
      group.users.push(user);
    }
    // lodges in insertion order, "none" last
    const entries = Array.from(map.values());
    const noneIndex = entries.findIndex((g) => g.key === "none");
    if (noneIndex >= 0 && noneIndex < entries.length - 1) {
      entries.push(entries.splice(noneIndex, 1)[0]);
    }
    return entries;
  }, [users, tokens]);

  function toggleUser(userId: number | string) {
    const value = String(userId);
    const next = new Set(mergedSelectedIds);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    // only emit explicit (non-derived) ids
    const nextExplicit = Array.from(next).filter(
      (id) => !derivedIds.includes(id) || id === value,
    );
    onChange(nextExplicit);
  }

  function removeExplicit(id: string) {
    onChange(explicitIds.filter((value) => value !== id));
  }

  const derivedOnlyCount = derivedIds.filter((id) => !explicitIds.includes(id)).length;
  const hasUsers = (users ?? []).length > 0;
  const visibleCount = groups.reduce((sum, group) => sum + group.users.length, 0);

  return (
    <div className="mb-4 w-full">
      <p id={labelId} className="ui-label">
        {label}
      </p>

      <Popover
        open={open}
        onOpenChange={(next) => {
          if (disabled && next) return;
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <button
            id={`${name}-trigger`}
            type="button"
            disabled={disabled}
            aria-labelledby={`${labelId} ${triggerTextId}`}
            className="ui-select flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span id={triggerTextId} className="truncate text-neutral-600">
              {explicitIds.length > 0
                ? `${explicitIds.length} vald${explicitIds.length === 1 ? "" : "a"} – sök för att lägga till fler`
                : "Sök och välj medlemmar"}
            </span>
            <span aria-hidden="true" className="text-neutral-600">
              ▾
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[18rem] p-2">
          <Command shouldFilter={false} label={label} loop>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={searchPlaceholder}
            />
            <CommandList>
              {loading ? (
                <div className="px-2 py-2 text-sm text-neutral-600" role="status">
                  Laddar…
                </div>
              ) : null}
              {!loading || hasUsers ? (
                <CommandEmpty>{hasUsers ? "Inga medlemmar matchade sökningen" : emptyLabel}</CommandEmpty>
              ) : null}
              {groups.map((group) => (
                <CommandGroup key={group.key} heading={group.lodgeName}>
                  {group.users.map((user) => {
                    const value = String(user.matrikelnummer);
                    const isChecked = mergedSelectedIds.has(value);
                    const isReadOnly =
                      derivedIds.includes(value) && !explicitIds.includes(value);
                    return (
                      <CommandItem
                        key={value}
                        value={value}
                        disabled={disabled || isReadOnly}
                        onSelect={() => toggleUser(user.matrikelnummer)}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[0.65rem] ${
                            isChecked
                              ? "border-primary-600 bg-primary-600 text-white"
                              : "border-neutral-300 bg-white"
                          }`}
                        >
                          {isChecked ? "✓" : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{fullName(user)}</span>
                        <span className="text-xs text-neutral-600">#{user.matrikelnummer}</span>
                        {isReadOnly ? (
                          <span className="text-xs text-neutral-600">via annat val</span>
                        ) : null}
                        {isChecked && !isReadOnly ? (
                          <span className="sr-only">(vald)</span>
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
            {hasUsers ? (
              <p className="sr-only" aria-live="polite">
                {visibleCount === 1 ? "1 träff" : `${visibleCount} träffar`}
              </p>
            ) : null}
          </Command>
        </PopoverContent>
      </Popover>

      {explicitIds.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Valda medlemmar">
          {explicitIds.map((id) => {
            const user = knownUsers.get(id);
            const display = user ? fullName(user) : `#${id}`;
            return (
              <li
                key={id}
                className="inline-flex min-h-11 items-center gap-1 rounded-md border border-primary-200 bg-primary-50 pl-3 text-sm text-neutral-900"
              >
                <span>{display}</span>
                <button
                  type="button"
                  onClick={() => removeExplicit(id)}
                  disabled={disabled}
                  aria-label={`Ta bort ${display}`}
                  className="flex h-11 w-11 items-center justify-center rounded-md text-neutral-600 hover:bg-primary-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {derivedOnlyCount > 0 ? (
        <p className="mt-2 text-xs text-neutral-600">
          {derivedOnlyCount === 1
            ? "1 medlem ingår redan via valda loger eller grupper."
            : `${derivedOnlyCount} medlemmar ingår redan via valda loger eller grupper.`}
        </p>
      ) : null}
    </div>
  );
}

export default UserSelection;
