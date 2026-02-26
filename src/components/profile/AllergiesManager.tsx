import { useEffect, useState } from "react";
import type { PublicUser } from "../../types";
import { listAllergies } from "../../services/allergies";

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
  isEditRoute,
  selectedIds,
  setSelectedIds,
}: {
  user?: PublicUser | null;
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
    (user as UserWithAllergies | undefined)?.allergies,
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
    <div className="mb-4 w-full flex flex-col items-center">
      <fieldset className="text-center mb-1 w-full">
        <legend className="block font-medium">Allergier</legend>
        {isEditRoute ? (
          <div className="flex flex-col items-center gap-2 py-2 w-full">
            {allergies.length > 0 ? (
              <div className="border rounded-md px-3 py-2 w-full md:w-[28rem] max-h-48 overflow-y-auto bg-white">
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
                        onChange={(event) =>
                          toggleAllergy(allergy.id, event.target.checked)
                        }
                      />
                      <span className="text-sm text-gray-700">
                        {allergy.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 py-2">Inga allergier</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-700 mb-4 py-2">
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
