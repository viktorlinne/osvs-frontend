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
    <div className="mb-4 w-full">
      <fieldset className="w-full">
        <legend className="ui-label">{label}</legend>
        <div id={name} className="flex w-full flex-col gap-2 py-2 md:flex-row md:flex-wrap">
          {hasLodges &&
            lodges!.map((lodge) => {
              const value = String(lodge.id);
              const inputId = `${name}-${lodge.id}`;
              return (
                <label
                  key={lodge.id}
                  htmlFor={inputId}
                  className={`inline-flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 ${
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
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                    onChange={(event) => toggle(lodge.id, event.target.checked)}
                  />
                  <span>{lodge.name}</span>
                </label>
              );
            })}
          {!hasLodges && !loading && (
            <div className="py-2 text-sm text-neutral-600">{emptyLabel}</div>
          )}
          {loading && <div className="py-2 text-sm text-neutral-600">Laddar loger...</div>}
        </div>
      </fieldset>
    </div>
  );
}

export default LodgeSelection;
