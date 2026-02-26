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

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const opts = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
    const ids = opts.length > 0 ? opts : null;
    setLocalSelected(ids);
    if (setSelectedIds) setSelectedIds(ids);
  }

  return (
    <fieldset className="text-center mb-1 w-full">
      <legend className="block font-medium">Tjänster</legend>
      {isEditRoute ? (
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 py-2 w-full">
          <select
            id="officials"
            name="officials"
            multiple
            value={effectiveSelected ? effectiveSelected.map(String) : []}
            onChange={onChange}
            className="border rounded-md px-3 py-2 w-full md:w-auto"
          >
            {officials.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="text-sm text-gray-700 mb-4">
          {effectiveSelected && effectiveSelected.length > 0
            ? effectiveSelected
              .map((id) => officials.find((o) => o.id === id)?.title ?? "")
              .filter(Boolean)
              .join(", ")
            : "Ingen tjänst"}
        </div>
      )}
    </fieldset>
  );
};
