import { useMemo } from "react";
import { normalizeSelectionIds } from "./lodgeSelectionUtils";

export type AudienceSelectionItem = {
  id: number;
  label: string;
  note?: string | null;
  disabled?: boolean;
  readOnly?: boolean;
};

export type AudienceSelectionProps = {
  items?: AudienceSelectionItem[] | null;
  selectedIds?: Array<string | number> | null;
  onChange: (ids: string[]) => void;
  label: string;
  name: string;
  disabled?: boolean;
  emptyLabel?: string;
  loading?: boolean;
  single?: boolean;
};

export function AudienceSelection({
  items,
  selectedIds,
  onChange,
  label,
  name,
  disabled = false,
  emptyLabel,
  loading = false,
  single = false,
}: AudienceSelectionProps) {
  const normalizedSelected = useMemo(
    () => normalizeSelectionIds(selectedIds),
    [selectedIds],
  );

  function toggle(itemId: number, checked: boolean) {
    const value = String(itemId);
    if (single) {
      onChange(checked ? [value] : []);
      return;
    }

    const next = new Set(normalizedSelected);
    if (checked) next.add(value);
    else next.delete(value);
    onChange(Array.from(next));
  }

  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <div className="mb-4 w-full">
      <fieldset className="w-full">
        <legend className="ui-label">{label}</legend>
        <div id={name} className="flex w-full flex-col gap-2 py-2 md:flex-row md:flex-wrap">
          {hasItems &&
            items!.map((item) => {
              const value = String(item.id);
              const isChecked = normalizedSelected.includes(value);
              const inputId = `${name}-${item.id}`;
              const isSingleLocked =
                single && normalizedSelected.length > 0 && !isChecked;
              const isDisabled =
                disabled || item.disabled || item.readOnly || isSingleLocked;

              return (
                <label
                  key={item.id}
                  htmlFor={inputId}
                  className={`inline-flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 ${
                    isDisabled ? "opacity-60" : ""
                  }`}
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    name={name}
                    value={value}
                    checked={isChecked}
                    disabled={isDisabled}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                    onChange={(event) => toggle(item.id, event.target.checked)}
                  />
                  <span>{item.label}</span>
                  {item.note ? (
                    <span className="text-xs text-neutral-500">{item.note}</span>
                  ) : null}
                </label>
              );
            })}
          {!hasItems && !loading && (
            <div className="py-2 text-sm text-neutral-600">{emptyLabel}</div>
          )}
          {loading && <div className="py-2 text-sm text-neutral-600">Laddar...</div>}
        </div>
      </fieldset>
    </div>
  );
}

export default AudienceSelection;
