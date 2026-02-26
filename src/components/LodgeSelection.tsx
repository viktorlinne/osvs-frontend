import { useMemo } from "react";
import type { Lodge } from "../types";
import { normalizeLodgeIds } from "./lodgeSelectionUtils";

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
  const rootClassName = ["mb-4 w-full flex flex-col items-center", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <fieldset className="text-center mb-1 w-full">
        <legend className="block font-medium">{label}</legend>
        <div
          id={name}
          className="flex flex-col md:flex-row md:flex-wrap gap-2 py-2 w-full"
        >
          {hasLodges &&
            lodges!.map((lodge) => {
              const value = String(lodge.id);
              const inputId = `${name}-${lodge.id}`;
              return (
                <label
                  key={lodge.id}
                  htmlFor={inputId}
                  className={`inline-flex items-center gap-2 border rounded-md px-3 py-2 ${
                    disabled ? "opacity-60" : ""
                  }`}
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    name={name}
                    value={value}
                    checked={normalizedSelected.includes(value)}
                    disabled={disabled}
                    onChange={(event) => toggle(lodge.id, event.target.checked)}
                  />
                  <span className="text-sm text-gray-700">{lodge.name}</span>
                </label>
              );
            })}
          {!hasLodges && !loading && (
            <div className="text-sm text-gray-500 py-2">{emptyLabel}</div>
          )}
          {loading && (
            <div className="text-sm text-gray-500 py-2">Laddar loger...</div>
          )}
        </div>
      </fieldset>
    </div>
  );
}

export default LodgeSelection;
