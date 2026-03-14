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
    <div className="mb-4 w-full text-center">
      <fieldset className="w-full">
        <legend className="ui-label text-center">Allergier</legend>
        {isEditRoute ? (
          <div className="flex w-full flex-col items-center gap-2 py-2">
            {allergies.length > 0 ? (
              <div className="mx-auto max-h-48 w-full overflow-y-auto rounded-md border border-neutral-200 bg-white px-3 py-2 md:w-[28rem]">
                <div className="flex flex-col gap-2 text-left">
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
              <div className="py-2 text-sm text-neutral-600">Inga allergier</div>
            )}
          </div>
        ) : (
          <div className="mb-4 py-2 text-center text-sm text-neutral-700">
            {effectiveSelected && effectiveSelected.length > 0
              ? effectiveSelected
                  .map(
                    (id) =>
                      allergies.find((allergy) => allergy.id === id)?.title ?? "",
                  )
                  .filter(Boolean)
                  .join(", ")
              : "Ingen allergi"}
          </div>
        )}
      </fieldset>
    </div>
  );
};
