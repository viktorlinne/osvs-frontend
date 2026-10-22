import type { Lodge } from "../types";
import { AudienceSelection } from "./AudienceSelection";
import { normalizeSelectionIds } from "./lodgeSelectionUtils";

export type LodgeSelectionProps = {
  lodges?: Lodge[] | null;
  selectedIds?: Array<string | number> | null;
  /**
   * Lodges shown as checked but read-only because they are implied by the
   * rest of the selection (not an explicit choice).
   */
  derivedSelectedIds?: Array<string | number> | null;
  derivedNote?: string;
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
  derivedSelectedIds,
  derivedNote = "täckt av urvalet",
  onChange,
  label = "Välj loger",
  name = "lodge-selection",
  disabled = false,
  emptyLabel = "Inga loger",
  loading = false,
}: LodgeSelectionProps) {
  const explicitIds = normalizeSelectionIds(selectedIds);
  const derivedIds = normalizeSelectionIds(derivedSelectedIds);
  const mergedSelectedIds = Array.from(new Set([...explicitIds, ...derivedIds]));

  return (
    <AudienceSelection
      items={(lodges ?? []).map((lodge) => {
        const isReadOnly =
          derivedIds.includes(String(lodge.id)) &&
          !explicitIds.includes(String(lodge.id));

        return {
          id: lodge.id,
          label: lodge.name,
          readOnly: isReadOnly,
          note: isReadOnly ? derivedNote : null,
        };
      })}
      selectedIds={mergedSelectedIds}
      onChange={onChange}
      label={label}
      name={name}
      disabled={disabled}
      emptyLabel={emptyLabel}
      loading={loading}
    />
  );
}

export default LodgeSelection;
