import { useEffect, useState } from "react";
import type { PublicUser } from "../../types";
import { listOfficials } from "../../services/officials";

type Official = { id: number; title: string };

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
    if (!field) return null;
    if (!Array.isArray(field)) return null;
    if (field.length === 0) return null;
    const first = field[0];
    if (typeof first === "object") {
      return (field as any[])
        .map((o) => Number((o && (o as any).id) ?? o))
        .filter((n) => Number.isFinite(n));
    }
    return (field as any[])
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));
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

  useEffect(() => {
    if (typeof selectedIds !== "undefined")
      setLocalSelected(selectedIds ?? null);
  }, [selectedIds]);

  useEffect(() => {
    // If parent controls `selectedIds`, don't override from `user`.
    if (typeof selectedIds !== "undefined") return;
    const u = user as any;
    const ids = normalizeOfficialsField(u?.officials);
    setLocalSelected(ids);
  }, [user, selectedIds]);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const opts = Array.from(e.target.selectedOptions).map((o) =>
      Number(o.value)
    );
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
            value={localSelected ? localSelected.map(String) : []}
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
          {localSelected && localSelected.length > 0
            ? localSelected
                .map((id) => officials.find((o) => o.id === id)?.title ?? "")
                .filter(Boolean)
                .join(", ")
            : "Ingen tjänst"}
        </div>
      )}
    </fieldset>
  );
};
