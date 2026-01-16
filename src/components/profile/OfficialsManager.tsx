import { useEffect, useState } from "react";
import type { PublicUser } from "../../types";

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
  const [localSelected, setLocalSelected] = useState<number[] | null>(
    selectedIds ??
      (user && (user as any).officials ? (user as any).officials : null)
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/officials`,
          {
            credentials: "include",
          }
        );
        if (!resp.ok) return;
        const json = await resp.json();
        let items: any[] = [];
        if (Array.isArray(json)) items = json;
        else if (json && Array.isArray((json as any).officials)) items = (json as any).officials;
        else if (json && (json as any).officials && typeof (json as any).officials === "object")
          items = Object.values((json as any).officials);
        else if (json && typeof json === "object")
          items = Object.values(json).filter((v) => v && typeof v === "object");
        if (mounted)
          setOfficials(
            items.map((i: any) => ({
              id: Number(i.id),
              title: String(i.title ?? ""),
            }))
          );
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
