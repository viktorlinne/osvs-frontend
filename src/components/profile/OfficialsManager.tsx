import { useEffect, useMemo, useState } from "react";
import { listOfficials } from "../../services/officials";
import type { OfficialHistoryItem, PublicUser } from "../../types";

type Official = { id: number; title: string };
type UserWithOfficials = PublicUser & {
  officials?: unknown;
  officialHistory?: unknown;
};

function normalizeOfficialsField(field: unknown): number[] | null {
  if (!Array.isArray(field) || field.length === 0) return null;
  const ids = field
    .map((item) => {
      if (typeof item === "object" && item !== null && "id" in item) {
        return Number((item as { id?: unknown }).id);
      }
      return Number(item);
    })
    .filter((value): value is number => Number.isFinite(value));
  return ids.length > 0 ? ids : null;
}

function normalizeOfficialHistoryField(field: unknown): OfficialHistoryItem[] {
  if (!Array.isArray(field) || field.length === 0) return [];
  return field
    .map((entry) => (entry && typeof entry === "object" ? entry : null))
    .filter(Boolean)
    .map((entry) => {
      const record = entry as Record<string, unknown>;
      const unappointedAt =
        record.unappointedAt ?? record.unAppointedAt ?? "";
      return {
        id: Number(record.id),
        title: String(record.title ?? ""),
        appointedAt: String(record.appointedAt ?? ""),
        unappointedAt: String(unappointedAt),
      };
    })
    .filter(
      (entry) =>
        Number.isFinite(entry.id) &&
        entry.title.length > 0 &&
        entry.appointedAt.length > 0 &&
        entry.unappointedAt.length > 0,
    );
}

function formatDate(value: string) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString("sv-SE");
}

export const OfficialsManager = ({
  user,
  assignedOfficials,
  historyEntries,
  isEditRoute,
  selectedIds,
  setSelectedIds,
}: {
  user?: PublicUser | null;
  assignedOfficials?: unknown;
  historyEntries?: unknown;
  isEditRoute?: boolean;
  selectedIds?: number[] | null;
  setSelectedIds?: (ids: number[] | null) => void;
}) => {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [localSelected, setLocalSelected] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await listOfficials();
        if (mounted) setOfficials(items);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const userOfficials = normalizeOfficialsField(
    assignedOfficials ?? (user as UserWithOfficials | undefined)?.officials,
  );
  const effectiveSelected =
    selectedIds !== undefined ? selectedIds : localSelected ?? userOfficials;

  const officialHistory = useMemo(
    () =>
      normalizeOfficialHistoryField(
        historyEntries ?? (user as UserWithOfficials | undefined)?.officialHistory,
      ),
    [historyEntries, user],
  );

  function toggleOfficial(officialId: number, checked: boolean) {
    const current = effectiveSelected ?? [];
    const next = checked
      ? Array.from(new Set([...current, officialId]))
      : current.filter((id) => id !== officialId);
    setLocalSelected(next);
    if (setSelectedIds) setSelectedIds(next);
  }

  return (
    <div className="w-full">
      <fieldset className="w-full">
        <legend className="ui-label">Aktiva tjänster</legend>
        {isEditRoute ? (
          <div className="mt-1.5 flex w-full flex-col gap-2">
            {loading ? (
              <p className="py-1 text-sm text-neutral-500">Laddar…</p>
            ) : officials.length > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-md border border-neutral-200 bg-white px-3 py-2">
                <div className="flex flex-col gap-2">
                  {officials.map((official) => (
                    <label
                      key={official.id}
                      htmlFor={`official-${official.id}`}
                      className="inline-flex items-center gap-2"
                    >
                      <input
                        id={`official-${official.id}`}
                        name="officials"
                        type="checkbox"
                        value={official.id}
                        checked={effectiveSelected?.includes(official.id) ?? false}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                        onChange={(event) =>
                          toggleOfficial(official.id, event.target.checked)
                        }
                      />
                      <span className="text-sm text-neutral-700">{official.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-1 text-sm text-neutral-600">Inga tjänster</p>
            )}
          </div>

        ) : (
          <p className="mt-0.5 text-sm text-neutral-900">
            {loading
              ? "Laddar…"
              : effectiveSelected && effectiveSelected.length > 0
                ? effectiveSelected
                    .map((id) => officials.find((o) => o.id === id)?.title ?? "")
                    .filter(Boolean)
                    .join(", ")
                : "Ingen tjänst"}
          </p>
        )}

        <div className="mt-4">
          <p className="ui-label">Tidigare tjänster</p>
          {officialHistory.length > 0 ? (
            <ul className="mt-1">
              {officialHistory.map((entry) => (
                <li
                  key={`${entry.id}-${entry.appointedAt}-${entry.unappointedAt}`}
                  className="ui-entry flex items-baseline justify-between gap-4 text-sm text-neutral-900"
                >
                  <span>{entry.title}</span>
                  <span className="shrink-0 text-xs text-neutral-600">
                    {formatDate(entry.appointedAt)} – {formatDate(entry.unappointedAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-neutral-600">Inga tidigare tjänster</p>
          )}
        </div>
      </fieldset>
    </div>
  );
};
