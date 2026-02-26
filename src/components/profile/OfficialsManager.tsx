import { useEffect, useMemo, useState } from "react";
import type { OfficialHistoryItem, PublicUser } from "../../types";
import { listOfficials } from "../../services/officials";

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
  isEditRoute,
  selectedIds,
  setSelectedIds,
}: {
  user?: PublicUser | null;
  isEditRoute?: boolean;
  selectedIds?: number[] | null;
  setSelectedIds?: (ids: number[] | null) => void;
}) => {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [localSelected, setLocalSelected] = useState<number[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await listOfficials();
        if (mounted) setOfficials(items);
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const userOfficials = normalizeOfficialsField(
    (user as UserWithOfficials | undefined)?.officials,
  );
  const effectiveSelected =
    selectedIds !== undefined ? selectedIds : localSelected ?? userOfficials;

  const officialHistory = useMemo(
    () =>
      normalizeOfficialHistoryField(
        (user as UserWithOfficials | undefined)?.officialHistory,
      ),
    [user],
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
    <div className="mb-4 w-full flex flex-col items-center">
      <fieldset className="text-center mb-1 w-full">
        <legend className="block font-medium">Tjänster</legend>
        {isEditRoute ? (
          <div className="flex flex-col items-center gap-2 py-2 w-full">
            {officials.length > 0 ? (
              <div className="border rounded-md px-3 py-2 w-full md:w-[28rem] max-h-48 overflow-y-auto bg-white">
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
                        onChange={(event) =>
                          toggleOfficial(official.id, event.target.checked)
                        }
                      />
                      <span className="text-sm text-gray-700">{official.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 py-2">Inga tjänster</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-700 mb-4 py-2">
            {effectiveSelected && effectiveSelected.length > 0
              ? effectiveSelected
                .map((id) => officials.find((official) => official.id === id)?.title ?? "")
                .filter(Boolean)
                .join(", ")
              : "Ingen tjänst"}
          </div>
        )}

        <div className="text-center mb-1">
          <label htmlFor="officialHistoryList" className="block font-medium">
            Tidigare tjänster
          </label>
          {officialHistory.length > 0 ? (
            <select
              id="officialHistoryList"
              name="officialHistoryList"
              className="w-auto border rounded-md px-4 py-2 mb-2"
            >
              {officialHistory.map((entry) => (
                <option
                  key={`${entry.id}-${entry.appointedAt}-${entry.unappointedAt}`}
                  value={`${entry.id}:${entry.appointedAt}`}
                >
                  {entry.title} {formatDate(entry.appointedAt)} — {formatDate(entry.unappointedAt)}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-gray-500 py-2">Inga tidigare tjänster</div>
          )}
        </div>
      </fieldset>
    </div>
  );
};
