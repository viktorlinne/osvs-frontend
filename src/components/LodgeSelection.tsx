import { useMemo } from "react";
import type { Lodge } from "../types";

export type LodgeSelectionProps = {
  lodges?: Lodge[] | null;
  selectedIds?: Array<string | number> | null;
  onChange: (ids: string[]) => void;
  label?: string;
  name?: string;
  disabled?: boolean;
  emptyLabel?: string;
  loading?: boolean;
  className?: string;
};

export function LodgeSelection({
  lodges,
  selectedIds,
  onChange,
  label = "Associera loger",
  name = "lodge-selection",
  disabled = false,
  emptyLabel = "Inga loger",
  loading = false,
  className = "",
}: LodgeSelectionProps) {
  const normalizedSelected = useMemo(
    () => normalizeLodgeIds(selectedIds),
    [selectedIds],
  );

  function toggle(lodgeId: number, checked: boolean) {
    const next = new Set(normalizedSelected);
    const value = String(lodgeId);
    if (checked) {
      next.add(value);
    } else {
      next.delete(value);
    }
    onChange(Array.from(next));
  }

  const hasLodges = Array.isArray(lodges) && lodges.length > 0;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="block text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <div
        id={name}
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 max-h-48 overflow-auto px-4 py-2 border rounded-md bg-gray-50"
      >
        {hasLodges &&
          lodges!.map((lodge) => {
            const value = String(lodge.id);
            return (
              <label key={lodge.id} className="flex items-center gap-x-3 py-2">
                <input
                  type="checkbox"
                  name={name}
                  value={value}
                  checked={normalizedSelected.includes(value)}
                  disabled={disabled}
                  onChange={(event) => toggle(lodge.id, event.target.checked)}
                />
                <span className="text-sm">{lodge.name}</span>
              </label>
            );
          })}
        {!hasLodges && !loading && (
          <div className="text-sm text-gray-500">{emptyLabel}</div>
        )}
        {loading && <div className="text-sm text-gray-500">Laddar loger…</div>}
      </div>
    </div>
  );
}

export function normalizeLodgeIds(
  input?: Array<string | number> | string | number | null,
): string[] {
  if (input == null) return [];
  const raw = Array.isArray(input) ? input : [input];
  return Array.from(
    new Set(
      raw
        .map((value) => String(value ?? "").trim())
        .filter((value) => value.length > 0),
    ),
  );
}

export default LodgeSelection;
