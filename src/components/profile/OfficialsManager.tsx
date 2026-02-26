import { useEffect, useState } from "react";
import type { PublicUser } from "../../types";
import { listOfficials } from "../../services/officials";

type Official = { id: number; title: string };
type UserWithOfficials = PublicUser & { officials?: unknown };

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

  // Normalize various shapes of `user.officials` into an array of numeric ids
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await listOfficials();
        if (mounted) setOfficials(items);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const userOfficials = normalizeOfficialsField(
    (user as UserWithOfficials | undefined)?.officials,
  );
  const effectiveSelected = selectedIds ?? localSelected ?? userOfficials;

  function toggleOfficial(officialId: number, checked: boolean) {
    const current = effectiveSelected ?? [];
    const next = checked
      ? Array.from(new Set([...current, officialId]))
      : current.filter((id) => id !== officialId);
    const ids = next.length > 0 ? next : null;
    setLocalSelected(ids);
    if (setSelectedIds) setSelectedIds(ids);
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
                  {officials.map((o) => (
                    <label
                      key={o.id}
                      htmlFor={`official-${o.id}`}
                      className="inline-flex items-center gap-2"
                    >
                      <input
                        id={`official-${o.id}`}
                        name="officials"
                        type="checkbox"
                        value={o.id}
                        checked={effectiveSelected?.includes(o.id) ?? false}
                        onChange={(event) =>
                          toggleOfficial(o.id, event.target.checked)
                        }
                      />
                      <span className="text-sm text-gray-700">{o.title}</span>
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
                  .map((id) => officials.find((o) => o.id === id)?.title ?? "")
                  .filter(Boolean)
                  .join(", ")
              : "Ingen tjänst"}
          </div>
        )}
      </fieldset>
    </div>
  );
};