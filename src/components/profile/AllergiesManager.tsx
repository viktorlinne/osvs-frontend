import { useEffect, useState } from "react";
import { listAllergies } from "../../services/allergies";
import type { PublicUser } from "../../types";

type Allergy = { id: number; title: string };
type UserWithAllergies = PublicUser & {
  allergies?: unknown;
};

function normalizeAllergiesField(field: unknown): number[] | null {
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

export const AllergiesManager = ({
  user,
  assignedAllergies,
  isEditRoute,
  selectedIds,
  setSelectedIds,
}: {
  user?: PublicUser | null;
  assignedAllergies?: unknown;
  isEditRoute?: boolean;
  selectedIds?: number[] | null;
  setSelectedIds?: (ids: number[] | null) => void;
}) => {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [localSelected, setLocalSelected] = useState<number[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await listAllergies();
        if (mounted) setAllergies(items);
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const userAllergies = normalizeAllergiesField(
    assignedAllergies ?? (user as UserWithAllergies | undefined)?.allergies,
  );
  const effectiveSelected =
    selectedIds !== undefined ? selectedIds : localSelected ?? userAllergies;

  function toggleAllergy(allergyId: number, checked: boolean) {
    const current = effectiveSelected ?? [];
    const next = checked
      ? Array.from(new Set([...current, allergyId]))
      : current.filter((id) => id !== allergyId);
    setLocalSelected(next);
    if (setSelectedIds) setSelectedIds(next);
  }

  return (
    <div className="w-full">
      <fieldset className="w-full">
        <legend className="ui-label">Allergier</legend>
        {isEditRoute ? (
          <div className="mt-1.5 flex w-full flex-col gap-2">
            {allergies.length > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-md border border-neutral-200 bg-white px-3 py-2">
                <div className="flex flex-col gap-2">
                  {allergies.map((allergy) => (
                    <label
                      key={allergy.id}
                      htmlFor={`allergy-${allergy.id}`}
                      className="inline-flex items-center gap-2"
                    >
                      <input
                        id={`allergy-${allergy.id}`}
                        name="allergies"
                        type="checkbox"
                        value={allergy.id}
                        checked={effectiveSelected?.includes(allergy.id) ?? false}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                        onChange={(event) =>
                          toggleAllergy(allergy.id, event.target.checked)
                        }
                      />
                      <span className="text-sm text-neutral-700">{allergy.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-1 text-sm text-neutral-600">Inga allergier</p>
            )}
          </div>
        ) : (
          <p className="mt-0.5 text-sm text-neutral-900">
            {effectiveSelected && effectiveSelected.length > 0
              ? effectiveSelected
                  .map((id) => allergies.find((a) => a.id === id)?.title ?? "")
                  .filter(Boolean)
                  .join(", ")
              : "Ingen allergi"}
          </p>
        )}
      </fieldset>
    </div>
  );
};
